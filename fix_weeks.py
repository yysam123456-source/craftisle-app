cron_path = "app/api/cron/pull-gsc-data/route.ts"
with open(cron_path, encoding="utf-8") as f:
    c = f.read()
old = """  const snapshotAt = new Date();
  snapshotAt.setUTCHours(0, 0, 0, 0);"""
new = """  const snapshotAt = new Date();
  const weekday = snapshotAt.getUTCDay();
  snapshotAt.setUTCDate(snapshotAt.getUTCDate() - (weekday === 0 ? 6 : weekday - 1)); // 本周一
  snapshotAt.setUTCHours(0, 0, 0, 0);"""
assert old in c, "cron pattern not found"
c = c.replace(old, new)
with open(cron_path, "w", encoding="utf-8") as f:
    f.write(c)
print("cron fixed")

for p in ["app/api/analytics/summary/route.ts", "app/api/analytics/top-queries/route.ts", "app/api/analytics/by-type/route.ts"]:
    with open(p, encoding="utf-8") as f:
        content = f.read()
    old1 = """    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);"""
    new1 = """    const weekStart = new Date(now);
    const weekday = now.getUTCDay();
    weekStart.setUTCDate(now.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);"""
    old1b = """    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);"""
    new1b = """    const weekStart = new Date();
    const weekday = weekStart.getUTCDay();
    weekStart.setUTCDate(weekStart.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);"""
    old2 = """    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    since.setUTCDate(since.getUTCDate() - since.getUTCDay());
    since.setUTCHours(0, 0, 0, 0);"""
    new2 = """    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekday2 = since.getUTCDay();
    since.setUTCDate(since.getUTCDate() - (weekday2 === 0 ? 6 : weekday2 - 1));
    since.setUTCHours(0, 0, 0, 0);"""
    changed = False
    if old1 in content:
        content = content.replace(old1, new1); changed = True
    if old1b in content:
        content = content.replace(old1b, new1b); changed = True
    if old2 in content:
        content = content.replace(old2, new2); changed = True
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"{p}: {'fixed' if changed else 'NO PATTERN'}")
