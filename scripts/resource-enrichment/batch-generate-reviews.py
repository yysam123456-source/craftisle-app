#!/usr/bin/env python3
"""
batch-generate-reviews.py
批量生成资源描述和 Review 数据

功能：
1. 读取所有资源 JSON 数据
2. 筛选出 description 为空或质量低的资源
3. 调用 OpenAI API 批量生成描述 + review
4. 输出为兼容现有系统的 JSON 格式
5. 支持断点续传、错误重试、速率限制

用法：
  python batch-generate-reviews.py --source free-for-dev --limit 100
  python batch-generate-reviews.py --source fmhy --min-desc-len 30 --limit 500
  python batch-generate-reviews.py --all-sources --dry-run

环境变量：
  OPENAI_API_KEY - OpenAI API Key（必需）
  OPENAI_BASE_URL - 可选，兼容第三方 API（如 DeepSeek、Azure）
  OPENAI_MODEL - 默认 gpt-4o-mini
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

try:
    import openai
except ImportError:
    print("错误: 需要 openai 包。请运行: pip install openai")
    sys.exit(1)

# ── 配置 ──────────────────────────────────────────

DEFAULT_MODEL = "gpt-4o-mini"
BATCH_SIZE = 5           # 每批处理资源数
RATE_LIMIT_DELAY = 1.0   # 每批之间延迟（秒）
MAX_RETRIES = 3
REVIEW_DIR = Path("public/data/reviews")
DATA_DIR = Path("public/data")
CHECKPOINT_FILE = Path("scripts/resource-enrichment/checkpoint.json")

# ── 类型定义 ──────────────────────────────────────

@dataclass
class Resource:
    id: str
    name: str
    url: str
    description: str
    category: str
    categoryName: str
    source: str
    freeTier: str = ""
    tags: list = None
    isFree: bool = True
    auth: str = ""
    https: bool = False
    cors: bool = False
    isOpenSource: bool = False
    license: str = ""
    language: str = ""
    githubStars: Optional[int] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []


# ── Prompt 模板 ───────────────────────────────────

DESCRIPTION_PROMPT = """You are a concise technical writer for a developer tools directory.

Write a 1-2 sentence description (80-150 characters) for this resource:

Name: {name}
URL: {url}
Category: {category}
{free_tier_info}{api_info}{selfhosted_info}

Requirements:
- Describe what the resource does and who it's for
- Mention 1 key benefit or feature
- Keep it factual, no marketing fluff
- Do not mention the URL domain

Output only the description text, no quotes or labels."""

REVIEW_PROMPT = """You are an expert developer tools reviewer. Write a structured review for this resource.

Name: {name}
URL: {url}
Category: {category}
Description: {description}
{free_tier_info}{api_info}{selfhosted_info}

Generate a JSON object with this exact structure:
{{
  "overview": "3-4 sentence detailed description covering: what it is, key features, target audience, and why developers use it. Be specific, mention real capabilities. 200-300 words.",
  "pros": ["4-5 specific advantages with concrete details"],
  "cons": ["2-3 realistic limitations or downsides"],
  "bestUseCases": ["3-4 specific scenarios where this tool shines"],
  "similarAlternatives": ["3-4 well-known alternative tools in the same category"]
}}

Output ONLY the JSON, no markdown formatting, no explanation."""


def build_free_tier_info(resource: Resource) -> str:
    if resource.freeTier and len(resource.freeTier.strip()) > 10:
        return f"Free Tier: {resource.freeTier[:500]}\n"
    return ""


def build_api_info(resource: Resource) -> str:
    parts = []
    if resource.auth:
        parts.append(f"Auth: {resource.auth}")
    if resource.https:
        parts.append("HTTPS: yes")
    if resource.cors:
        parts.append("CORS: yes")
    return "API Info: " + ", ".join(parts) + "\n" if parts else ""


def build_selfhosted_info(resource: Resource) -> str:
    parts = []
    if resource.isOpenSource:
        parts.append("Open Source")
    if resource.license:
        parts.append(f"License: {resource.license}")
    if resource.language:
        parts.append(f"Built with: {resource.language}")
    return "Self-Hosted Info: " + ", ".join(parts) + "\n" if parts else ""


def format_prompt(template: str, resource: Resource) -> str:
    return template.format(
        name=resource.name,
        url=resource.url,
        category=resource.categoryName or resource.category,
        description=resource.description or "",
        free_tier_info=build_free_tier_info(resource),
        api_info=build_api_info(resource),
        selfhosted_info=build_selfhosted_info(resource),
    )


# ── OpenAI 调用 ───────────────────────────────────

def get_client():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("错误: 请设置 OPENAI_API_KEY 环境变量")
        sys.exit(1)

    base_url = os.environ.get("OPENAI_BASE_URL")
    model = os.environ.get("OPENAI_MODEL", DEFAULT_MODEL)

    client = openai.OpenAI(api_key=api_key, base_url=base_url)
    return client, model


def call_openai(client: openai.OpenAI, model: str, prompt: str, max_retries: int = MAX_RETRIES) -> Optional[str]:
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates accurate, factual content about developer tools."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
            )
            return response.choices[0].message.content
        except openai.RateLimitError:
            wait = 2 ** attempt * 5
            print(f"  速率限制，等待 {wait} 秒...")
            time.sleep(wait)
        except Exception as e:
            print(f"  调用失败 (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    return None


# ── 数据加载 ──────────────────────────────────────

def load_free_for_dev_resources() -> list[Resource]:
    path = DATA_DIR / "free-for-dev-resources.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    resources = []
    for r in data.get("resources", []):
        resources.append(Resource(
            id=r["id"],
            name=r["name"],
            url=r["url"],
            description=r.get("description", ""),
            category=r.get("category", ""),
            categoryName=r.get("categoryName", ""),
            source="free-for-dev",
            freeTier=r.get("freeTier", ""),
            tags=r.get("tags", []),
            isFree=r.get("isFree", True),
        ))
    return resources


def load_fmhy_resources() -> list[Resource]:
    path = DATA_DIR / "fmhy-resources.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    resources = []
    for cat_id, cat_data in data.get("categories", {}).items():
        cat_name = cat_data.get("name", cat_id)
        for r in cat_data.get("resources", []):
            resources.append(Resource(
                id=r["id"],
                name=r["name"],
                url=r["url"],
                description=r.get("description", ""),
                category=cat_id,
                categoryName=cat_name,
                source="fmhy",
                tags=r.get("tags", []),
            ))
    return resources


def load_public_apis_resources() -> list[Resource]:
    path = DATA_DIR / "public-apis-resources.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    resources = []
    for r in data.get("resources", []):
        resources.append(Resource(
            id=r["id"],
            name=r["name"],
            url=r["url"],
            description=r.get("description", ""),
            category=r.get("category", ""),
            categoryName=r.get("categoryName", ""),
            source="public-apis",
            auth=r.get("auth", ""),
            https=r.get("https", False),
            cors=r.get("cors", False),
            tags=r.get("tags", []),
        ))
    return resources


def load_selfhosted_resources() -> list[Resource]:
    path = DATA_DIR / "awesome-selfhosted-resources.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    resources = []
    for r in data.get("resources", []):
        resources.append(Resource(
            id=r["id"],
            name=r["name"],
            url=r["url"],
            description=r.get("description", ""),
            category=r.get("category", ""),
            categoryName=r.get("categoryName", ""),
            source="awesome-selfhosted",
            isOpenSource=r.get("isOpenSource", False),
            license=r.get("license", ""),
            language=r.get("language", ""),
            tags=r.get("tags", []),
        ))
    return resources


SOURCE_LOADERS = {
    "free-for-dev": load_free_for_dev_resources,
    "fmhy": load_fmhy_resources,
    "public-apis": load_public_apis_resources,
    "awesome-selfhosted": load_selfhosted_resources,
}


# ── 检查点管理 ────────────────────────────────────

def load_checkpoint() -> set[str]:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return set(data.get("completed_ids", []))
    return set()


def save_checkpoint(completed_ids: set[str]):
    CHECKPOINT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump({"completed_ids": sorted(list(completed_ids))}, f, indent=2)


# ── Review 输出 ───────────────────────────────────

def write_review(resource: Resource, review_content: dict):
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    review_data = {
        "resourceId": resource.id,
        "resourceName": resource.name,
        "resourceUrl": resource.url,
        "source": resource.source,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "version": 1,
        "content": review_content,
    }

    file_path = REVIEW_DIR / f"{resource.id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(review_data, f, indent=2, ensure_ascii=False)

    # 更新 manifest
    manifest_path = REVIEW_DIR / "_manifest.json"
    manifest = {"reviews": []}
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

    # 去重添加
    existing_ids = {r["resourceId"] for r in manifest.get("reviews", [])}
    if resource.id not in existing_ids:
        manifest["reviews"].append({
            "resourceId": resource.id,
            "resourceName": resource.name,
            "file": f"{resource.id}.json",
        })
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)


# ── 主逻辑 ────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="批量生成资源描述和 Review 数据")
    parser.add_argument("--source", choices=list(SOURCE_LOADERS.keys()), help="指定数据源")
    parser.add_argument("--all-sources", action="store_true", help="处理所有数据源")
    parser.add_argument("--limit", type=int, default=0, help="限制处理数量（0=不限制）")
    parser.add_argument("--min-desc-len", type=int, default=0, help="最小描述长度，低于此值的才处理")
    parser.add_argument("--dry-run", action="store_true", help="只打印，不调用 API")
    parser.add_argument("--only-description", action="store_true", help="只生成描述，不生成 review")
    parser.add_argument("--only-review", action="store_true", help="只生成 review（需要已有描述）")
    args = parser.parse_args()

    if not args.source and not args.all_sources:
        print("错误: 请指定 --source 或 --all-sources")
        parser.print_help()
        sys.exit(1)

    # 加载资源
    sources = list(SOURCE_LOADERS.keys()) if args.all_sources else [args.source]
    all_resources: list[Resource] = []
    for src in sources:
        resources = SOURCE_LOADERS[src]()
        print(f"加载 {src}: {len(resources)} 个资源")
        all_resources.extend(resources)

    # 筛选需要处理的资源
    filtered = []
    for r in all_resources:
        desc_len = len(r.description.strip()) if r.description else 0
        if desc_len < args.min_desc_len:
            filtered.append(r)

    if args.limit > 0:
        filtered = filtered[:args.limit]

    print(f"需要处理: {len(filtered)} 个资源 (总共 {len(all_resources)})")

    if args.dry_run:
        print("\n=== Dry Run 预览 ===")
        for r in filtered[:5]:
            print(f"\n[{r.source}] {r.name}")
            print(f"  desc({len(r.description)} chars): {r.description[:80]}...")
        print(f"\n... 还有 {max(0, len(filtered) - 5)} 个")
        return

    # 加载检查点
    completed_ids = load_checkpoint()
    print(f"检查点: 已跳过 {len(completed_ids)} 个")

    # 初始化 OpenAI
    client, model = get_client()
    print(f"使用模型: {model}")

    processed = 0
    succeeded = 0
    failed = 0

    for i, resource in enumerate(filtered):
        if resource.id in completed_ids:
            continue

        print(f"\n[{i+1}/{len(filtered)}] {resource.name} ({resource.source})")

        # 生成描述
        if not args.only_review:
            prompt = format_prompt(DESCRIPTION_PROMPT, resource)
            desc_result = call_openai(client, model, prompt)
            if desc_result:
                # 清理结果
                desc_result = desc_result.strip().strip('"').strip("'")
                print(f"  描述: {desc_result[:80]}...")
                resource.description = desc_result
                processed += 1
            else:
                print(f"  描述生成失败")
                failed += 1
                continue

        # 生成 Review
        if not args.only_description:
            review_prompt = format_prompt(REVIEW_PROMPT, resource)
            review_result = call_openai(client, model, review_prompt)
            if review_result:
                try:
                    # 清理可能的 markdown 代码块
                    cleaned = review_result.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cleaned = cleaned.strip()

                    review_content = json.loads(cleaned)
                    write_review(resource, review_content)
                    print(f"  Review 已保存")
                    succeeded += 1
                except json.JSONDecodeError as e:
                    print(f"  Review JSON 解析失败: {e}")
                    print(f"  原始内容: {review_result[:200]}...")
                    failed += 1
                    continue
            else:
                print(f"  Review 生成失败")
                failed += 1
                continue

        # 标记完成
        completed_ids.add(resource.id)
        save_checkpoint(completed_ids)

        # 速率限制
        if i < len(filtered) - 1:
            time.sleep(RATE_LIMIT_DELAY)

    print(f"\n=== 完成 ===")
    print(f"处理: {processed}, 成功: {succeeded}, 失败: {failed}")
    print(f"检查点已保存到: {CHECKPOINT_FILE}")


if __name__ == "__main__":
    main()
