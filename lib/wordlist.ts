/**
 * 常见英文词表 —— passphrase 模式用。
 *
 * 🔴 安全边界（必须对用户如实说明，不要夸大）：
 *   256 词 ⇒ 每词约 8 bit。7 词 ≈ 56 bit，低于 NIST 建议的随机字符长度的
 *   强度，但远高于人类能记住的同长度字符串。**高安全场景（主密码、密钥、
 *   金融账号）应使用字符模式**，passphrase 面向的是「要能背下来 / 要能
 *   打字出来 / 要给不熟技术的人用」的场景。
 *
 * 选词原则：具体名词为主、长度 3-9 字母、无歧义读音、跨领域分散，
 * 避免 NSFW 与易混词（数字/字母同形、音近词）。
 */
export const PASSPHRASE_WORDS: string[] = [
  "anchor", "apple", "arrow", "autumn", "badge", "bamboo", "basket", "beacon",
  "berry", "birch", "bishop", "blanket", "boulder", "branch", "bridge", "bronze",
  "bucket", "bugle", "cabin", "cactus", "camera", "candle", "canvas", "canyon",
  "carbon", "cargo", "castle", "cavern", "cedar", "cello", "chalk", "cherry",
  "cider", "circle", "citrus", "clover", "cobalt", "comet", "compass", "copper",
  "coral", "cottage", "crayon", "cricket", "crown", "cypress", "daisy", "dawn",
  "delta", "denim", "desert", "dolphin", "donkey", "dragon", "drift", "dune",
  "eagle", "ember", "engine", "escape", "falcon", "feather", "fennel", "fern",
  "field", "finch", "fjord", "flame", "flint", "forest", "fossil", "fountain",
  "fox", "frost", "galaxy", "garden", "garlic", "ginger", "glacier", "glider",
  "granite", "grape", "grotto", "guitar", "hammer", "harbor", "harvest", "hazel",
  "hedge", "heron", "hollow", "honey", "horizon", "hunter", "iceberg", "indigo",
  "island", "ivory", "jacket", "jaguar", "jasmine", "jigsaw", "jungle", "juniper",
  "kayak", "kernel", "kettle", "keyhole", "kingdom", "kite", "koala", "lagoon",
  "lantern", "lattice", "laurel", "lavender", "ledger", "lemon", "lens", "lilac",
  "linen", "lizard", "lotus", "lumber", "lunar", "lynx", "magnet", "mango",
  "maple", "marble", "marina", "meadow", "melon", "meteor", "mint", "mirror",
  "monsoon", "mosaic", "mountain", "mushroom", "mustang", "nectar", "needle", "nickel",
  "nutmeg", "oasis", "ocean", "olive", "onyx", "opal", "orbit", "orchid",
  "otter", "oxide", "oyster", "paddle", "palace", "palm", "pantry", "papaya",
  "parchment", "pebble", "pelican", "pepper", "pigeon", "pillar", "pilot", "pinecone",
  "pistachio", "plateau", "plum", "pocket", "prairie", "pumpkin", "quarry", "quartz",
  "quiver", "rabbit", "radish", "rainbow", "raven", "reef", "ribbon", "ridge",
  "rifle", "river", "robin", "rosemary", "sail", "sandal", "sapphire", "satchel",
  "scarlet", "seagull", "sequoia", "shadow", "shell", "sierra", "silver", "sketch",
  "slate", "sparrow", "spruce", "squash", "stable", "station", "stellar", "stone",
  "storm", "summit", "sunset", "talon", "tandem", "tangent", "tapestry", "teapot",
  "tempest", "thicket", "thistle", "thunder", "timber", "tinder", "topaz", "trail",
  "tulip", "tundra", "tunnel", "turquoise", "valley", "vapor", "velvet", "vineyard",
  "violet", "vista", "walnut", "walrus", "willow", "windmill", "wombat", "yarrow",
  "yogurt", "zebra", "zenith", "zephyr", "zinnia", "acorn", "alcove", "antler",
  "atlas", "awning", "basil", "bayou", "bellows", "bobbin", "bulwark",
  "chalice", "cinder", "citadel", "cobble", "colt",
];