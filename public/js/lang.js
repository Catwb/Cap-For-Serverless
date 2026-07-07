const LANG = {
  en: {
    // ── Sidebar ──
    "search_placeholder": "Search keys...",
    "new_key": "New key",
    "settings": "Settings",
    "menu_open": "Open menu",

    // ── Welcome ──
    "welcome_title": "Add Cap to your site in 60 seconds",
    "welcome_subtitle": "Create a sitekey, paste two snippets, you're live.",
    "welcome_cta": "Create your first key",
    "welcome_steps": "1. Name your key   2. Copy the snippets   3. Ship",
    "read_docs": "Read the docs →",

    // ── Login ──
    "login_title": "The self-hosted CAPTCHA for the modern web.",
    "admin_key": "Admin key",
    "continue_cap": "Continue to Cap",
    "report_issues": "Report issues",
    "powered_by": "Powered by Cap",
    "show_hide_password": "Show/hide password",
    "incorrect_key": "Incorrect admin key",

    // ── Tester ──
    "key_id": "Key ID:",
    "secret_key": "Secret key:",
    "start": "Start",
    "no_logs": "No logs",

    // ── Tabs ──
    "tab_activity": "Activity",
    "tab_integration": "Integration",
    "tab_configuration": "Configuration",

    // ── Key list ──
    "error_loading_keys": "Error loading keys",
    "no_matching_keys": "No matching keys",
    "no_keys_yet": "No keys yet!",
    "n_recent_solves": "{0} recent solves",
    "copy_site_key": "Copy site key",
    "copied": "Copied!",

    // ── Time range ──
    "today": "Today",
    "yesterday": "Yesterday",
    "last_7_days": "Last 7 days",
    "last_30_days": "Last 30 days",
    "last_3_months": "Last 3 months",
    "all_time": "All time",

    // ── Stats ──
    "stat_challenges": "Challenges",
    "stat_verified": "Verified",
    "stat_failed": "Failed",
    "stat_avg_duration": "Avg. duration",

    // ── Chart ──
    "chart_challenges": "Challenges",
    "chart_verified": "Verified",
    "chart_failed": "Failed",

    // ── Integration ──
    "frontend": "Frontend",
    "docs_hint": "Check our documentation for more frameworks and details.",
    "documentation": "documentation",
    "server_verification": "Server verification",
    "ai_prompt": "AI prompt",
    "ai_hint": "Drop this into your AI assistant to have it implement Cap end-to-end.",
    "copy": "Copy",
    "copy_prompt": "Copy prompt",
    "copied_tooltip": "Copied",

    // ── Configuration ──
    "config_main": "Main",
    "config_name": "Name",
    "config_protocol": "Challenge protocol",
    "config_sha256": "SHA-256",
    "config_rsw": "RSW (experimental)",
    "config_difficulty": "Difficulty",
    "config_challenge_count": "Challenge count",
    "config_rsw_difficulty": "RSW difficulty",
    "config_rsw_hint": "Higher difficulty means slower solve time",
    "config_instrumentation": "Instrumentation",
    "config_enable_instrumentation": "Enable instrumentation challenges",
    "config_block_headless": "Attempt to block headless browsers",
    "config_block_headless_hint": "This may cause issues with testing or agent browsers and is not entirely foolproof.",
    "config_obfuscation": "Obfuscation level",
    "config_obfuscation_hint": "Higher obfuscation may result in higher CPU usage.",
    "save": "Save",

    // ── Security ──
    "security": "Security",
    "rate_limiting": "Rate limiting",
    "rate_limit_desc": "Override the global rate limit for this key. Leave empty to use the global defaults",
    "max_requests": "Max requests",
    "window_ms": "Window (ms)",
    "cors": "CORS",
    "restrict_origins": "Restrict allowed origins",
    "origins_desc": "Only these origins will be able to request challenges for this key.",
    "add_origin": "Add an origin...",
    "remove": "Remove",
    "request_filtering": "Request filtering",
    "filtering_desc": "Override the global filtering for this key. Leave unchecked to use global defaults.",
    "block_non_browser": "Block non-browser user agents",
    "block_non_browser_hint": "Blocks requests from bots, scripts, and other non-browser clients (e.g. python-requests, curl).",
    "require_browser_headers": "Require browser headers",
    "require_browser_headers_hint": "Block requests missing common browser headers.",

    // ── Block rules ──
    "block_rules": "Block rules",
    "add_rule": "Add rule",
    "no_block_rules": "No block rules yet",
    "badge_ip": "IP",
    "badge_range": "Range",
    "badge_asn": "ASN",
    "badge_country": "Country",
    "permanent": "Permanent",
    "expires_date": "Expires {0}",
    "remove_rule": "Remove",

    // ── Danger zone ──
    "danger_zone": "Danger zone",
    "reset_secret": "Reset site secret",
    "delete_key_btn": "Delete key",

    // ── Generic buttons ──
    "cancel": "Cancel",
    "delete": "Delete",
    "block": "Block",
    "close": "Close",
    "open_key": "Open key",
    "done": "Done",
    "create": "Create",
    "rotate": "Rotate",

    // ── Error modals ──
    "error": "Error",
    "failed_load_key": "Failed to load key: {0}",
    "check_input": "Please check your input values.",
    "failed_save_config": "Failed to save configuration.",
    "failed_save_security": "Failed to save security settings.",
    "failed_rotate_secret": "Failed to rotate secret key.",
    "failed_delete_key": "Failed to delete key.",
    "failed_generate_rsw": "Failed to generate the RSW keypair. Try again in a moment.",
    "failed_create_key": "Failed to create key.",
    "failed_create_apikey": "Failed to create API key.",
    "download_failed": "Download failed",

    // ── Create key modal ──
    "create_key_title": "Create key",
    "key_name": "Key name",
    "enable_instrumentation": "Enable instrumentation (recommended)",
    "block_headless": "Attempt to block headless browsers",
    "restrict_origins_label": "Restrict allowed origins",
    "origins_hint": "Only these origins will be able to request challenges for this key.",
    "origin_placeholder": "example.com",

    // ── Key created modal ──
    "key_created_title": "Key created",
    "site_key_label": "Site key",
    "secret_key_label": "Secret key",
    "copy_secret_hint": "Make sure to copy your secret key — it won't be shown again.",

    // ── Rotate secret ──
    "rotate_title": "Rotate Secret?",
    "rotate_msg": "This will generate a new secret key. Your existing integrations will stop working until updated.",
    "rotated_title": "Rotated secret key",
    "new_secret_key": "New secret key",
    "copy_new_secret_hint": "Make sure to copy this — it won't be shown again.",

    // ── Delete key ──
    "delete_key_title": "Delete Key?",
    "delete_key_msg": "This will permanently delete this key and all associated data. This cannot be undone.",

    // ── Block rule modal ──
    "add_block_rule": "Add block rule",
    "type": "Type",
    "ip_address": "IP address",
    "ip_range": "IP range (CIDR)",
    "asn_option": "ASN",
    "country_option": "Country",
    "ip_value": "IP address",
    "ip_range_value": "IP range (CIDR)",
    "asn_value": "ASN number or name",
    "country_value": "Value",
    "country_code": "Country code",
    "ip_placeholder": "e.g. 1.2.3.4",
    "cidr_placeholder": "e.g. 10.0.0.0/8",
    "asn_placeholder": "e.g. AS15169",
    "duration": "Duration",
    "perm_option": "Permanent",
    "hour_1": "1 hour",
    "hours_24": "24 hours",
    "days_7": "7 days",
    "days_30": "30 days",
    "select_country": "Select country...",

    // ── Site key clipboard ──
    "site_key_dialog": "Site Key",

    // ── Settings tabs ──
    "settings_sessions": "Sessions",
    "settings_security": "Security",
    "settings_ip_data": "IP data",
    "settings_api_keys": "API keys",
    "settings_about": "About",

    // ── Global settings ──
    "global_rate_limit": "Global rate limit",
    "global_rate_desc": "Default rate limit applied to all challenge endpoints. Individual keys can override these values in their configuration.",
    "requests_per_window": "Requests allowed per window",
    "window_hint": "Time window in milliseconds (e.g. 5000 = 5s)",
    "global_origins_hint": "Only these origins will be able to request challenges. Individual keys can override this.",
    "global_filtering_desc": "Block requests that don't look like they come from real browsers. Individual keys can override these defaults.",

    // ── IP data ──
    "ip_header": "IP header",
    "ip_header_desc": "Set the header your reverse proxy uses to pass the client's real IP. Used for rate limiting, IP tracking, and geo lookups.",
    "presets": "Presets",
    "cloudflare": "Cloudflare",
    "vercel": "Vercel",
    "nginx": "Nginx",
    "clear": "Clear",
    "ip_header_label": "IP header",
    "ip_header_placeholder": "e.g. CF-Connecting-IP",
    "country_asn": "Country & ASN data",
    "country_asn_desc": "Choose how to resolve country and ASN for each IP. Use headers if your reverse proxy provides them, or download an IP database for automatic lookups.",
    "tab_ip_database": "IP Database",
    "tab_proxy_headers": "Proxy headers",
    "provider": "Provider",
    "dbip_lite": "DB-IP Lite (free, no key needed)",
    "maxmind": "MaxMind GeoLite2 (free, needs license key)",
    "ipinfo": "IPInfo (API, needs token)",
    "maxmind_account": "MaxMind account ID",
    "maxmind_account_placeholder": "Your MaxMind account ID",
    "maxmind_license": "MaxMind license key",
    "maxmind_license_placeholder": "Your GeoLite2 license key",
    "ipinfo_token": "IPInfo token",
    "ipinfo_token_placeholder": "Your IPInfo API token",
    "download_activate": "Download & activate",
    "update": "Update",
    "delete_db": "Delete",
    "downloading": "Downloading...",
    "downloading_file": "Downloading {0}... {1}%",
    "downloading_kb": "Downloading {0}... {1} KB",
    "starting_download": "Starting download...",
    "updating": "Updating...",
    "country_header": "Country header",
    "country_header_placeholder": "e.g. CF-IPCountry",
    "country_header_hint": "Header containing the 2-letter ISO country code",
    "asn_header": "ASN / Network header",
    "asn_header_placeholder": "e.g. CF-IPOrg",
    "asn_header_hint": "Header containing the ASN or network name",

    // ── Sessions ──
    "current": "Current",
    "logout": "Logout",
    "expires": "expires {0}",

    // ── API keys ──
    "no_api_keys": "No API keys yet",
    "key_id_meta": "{0}... · created {1}",

    // ── About ──
    "star_on_github": "Star on GitHub",
    "version_info": "Standalone v{0}<br>Node.js",
    "demo_mode_badge": "Demo mode",

    // ── API key modals ──
    "create_apikey_title": "Create API Key",
    "apikey_name": "Key name",
    "apikey_created_title": "API key created",
    "apikey_label": "API key",
    "apikey_hint": "Make sure to copy your API key — it won't be shown again.",
    "delete_apikey_title": "Delete API key?",
    "delete_apikey_msg": "This will permanently delete this API key.",
    "delete_ipdb_title": "Delete IP Database?",
    "delete_ipdb_msg": "This will remove the downloaded IP database files. Country and ASN lookups will stop working unless you have headers configured.",

    // ── Geo / Insights ──
    "location": "Location",
    "networks": "Networks",
    "platform": "Platform",
    "os": "OS",
    "list_view": "List view",
    "map_view": "Map view",
    "search_networks": "Search networks",
    "filter_networks": "Filter networks…",
    "no_location_no_source": "Configure a lookup source in IP data settings to store location data.",
    "no_location_has_source": "No location data yet.",
    "no_network_no_source": "Configure a lookup source in IP data settings to store network data.",
    "no_network_has_source": "No network data yet.",
    "no_platform_data": "No platform data yet.",
    "no_os_data": "No OS data yet.",
    "failed_load_map": "Failed to load map data",

    // ── Map tooltip ──
    "map_tooltip": "{0} • {1} challenges",

    // ── IPDB status ──
    "dbip_name": "DB-IP Lite",
    "maxmind_name": "MaxMind GeoLite2",
    "ipinfo_name": "IPInfo API",
    "updated_relative": "Updated {0}",
    "country_size": "Country: {0} (loaded)",
    "asn_size": "ASN: {0} (loaded)",

    // ── Relative time ──
    "year": "year",
    "years": "years",
    "month": "month",
    "months": "months",
    "week": "week",
    "weeks": "weeks",
    "day": "day",
    "days": "days",
    "hour": "hour",
    "hours": "hours",
    "minute": "minute",
    "minutes": "minutes",
    "n_unit_ago": "{0} {1} ago",
    "in_n_unit": "in {0} {1}",
    "just_now": "just now",
    "in_a_moment": "in a moment",

    // ── RSW ──
    "preparing_rsw": "Preparing RSW keypair…",

    // ── Misc ──
    "challenges": "challenges",
  },

  zh: {
    "search_placeholder": "搜索密钥…",
    "new_key": "新建密钥",
    "settings": "设置",
    "menu_open": "打开菜单",

    "welcome_title": "60 秒内为你的网站集成 Cap",
    "welcome_subtitle": "创建一个站点密钥，粘贴两段代码，即刻上线。",
    "welcome_cta": "创建第一个密钥",
    "welcome_steps": "1. 命名密钥   2. 复制代码   3. 上线",
    "read_docs": "阅读文档 →",

    "login_title": "为现代 Web 打造的自托管验证码。",
    "admin_key": "管理员密钥",
    "continue_cap": "进入 Cap",
    "report_issues": "反馈问题",
    "powered_by": "由 Cap 驱动",
    "show_hide_password": "显示/隐藏密码",
    "incorrect_key": "管理员密钥错误",

    "key_id": "密钥 ID：",
    "secret_key": "密钥：",
    "start": "开始",
    "no_logs": "无日志",

    "tab_activity": "活动",
    "tab_integration": "集成",
    "tab_configuration": "配置",

    "error_loading_keys": "加载密钥失败",
    "no_matching_keys": "没有匹配的密钥",
    "no_keys_yet": "还没有密钥！",
    "n_recent_solves": "最近 {0} 次验证",
    "copy_site_key": "复制站点密钥",
    "copied": "已复制！",

    "today": "今天",
    "yesterday": "昨天",
    "last_7_days": "最近 7 天",
    "last_30_days": "最近 30 天",
    "last_3_months": "最近 3 个月",
    "all_time": "全部",

    "stat_challenges": "挑战数",
    "stat_verified": "验证通过",
    "stat_failed": "验证失败",
    "stat_avg_duration": "平均耗时",

    "chart_challenges": "挑战数",
    "chart_verified": "验证通过",
    "chart_failed": "验证失败",

    "frontend": "前端",
    "docs_hint": "查看我们的文档了解更多框架和细节。",
    "documentation": "文档",
    "server_verification": "服务端验证",
    "ai_prompt": "AI 提示词",
    "ai_hint": "将这段提示词交给 AI 助手，让它为你完整实现 Cap 集成。",
    "copy": "复制",
    "copy_prompt": "复制提示词",
    "copied_tooltip": "已复制",

    "config_main": "基本设置",
    "config_name": "名称",
    "config_protocol": "挑战协议",
    "config_sha256": "SHA-256",
    "config_rsw": "RSW（实验性）",
    "config_difficulty": "难度",
    "config_challenge_count": "挑战数量",
    "config_rsw_difficulty": "RSW 难度",
    "config_rsw_hint": "难度越高，解答速度越慢",
    "config_instrumentation": "插桩",
    "config_enable_instrumentation": "启用插桩挑战",
    "config_block_headless": "尝试屏蔽无头浏览器",
    "config_block_headless_hint": "可能会影响测试或代理浏览器，并非完全可靠。",
    "config_obfuscation": "混淆级别",
    "config_obfuscation_hint": "更高的混淆级别可能增加 CPU 使用率。",
    "save": "保存",

    "security": "安全",
    "rate_limiting": "速率限制",
    "rate_limit_desc": "覆盖该密钥的全局速率限制。留空则使用全局默认值。",
    "max_requests": "最大请求数",
    "window_ms": "时间窗口（毫秒）",
    "cors": "跨域设置",
    "restrict_origins": "限制允许的域名",
    "origins_desc": "仅这些域名可以请求该密钥的挑战。",
    "add_origin": "添加域名…",
    "remove": "移除",
    "request_filtering": "请求过滤",
    "filtering_desc": "覆盖该密钥的全局过滤设置。留空则使用全局默认值。",
    "block_non_browser": "拦截非浏览器用户代理",
    "block_non_browser_hint": "拦截来自机器人、脚本等非浏览器客户端的请求（如 python-requests、curl）。",
    "require_browser_headers": "要求浏览器标头",
    "require_browser_headers_hint": "拦截缺少常见浏览器标头的请求。",

    "block_rules": "封禁规则",
    "add_rule": "添加规则",
    "no_block_rules": "暂无封禁规则",
    "badge_ip": "IP",
    "badge_range": "范围",
    "badge_asn": "ASN",
    "badge_country": "国家",
    "permanent": "永久",
    "expires_date": "到期 {0}",
    "remove_rule": "移除",

    "danger_zone": "危险区域",
    "reset_secret": "重置站点密钥",
    "delete_key_btn": "删除密钥",

    "cancel": "取消",
    "delete": "删除",
    "block": "封禁",
    "close": "关闭",
    "open_key": "打开密钥",
    "done": "完成",
    "create": "创建",
    "rotate": "轮换",

    "error": "错误",
    "failed_load_key": "加载密钥失败：{0}",
    "check_input": "请检查输入值。",
    "failed_save_config": "保存配置失败。",
    "failed_save_security": "保存安全设置失败。",
    "failed_rotate_secret": "轮换密钥失败。",
    "failed_delete_key": "删除密钥失败。",
    "failed_generate_rsw": "生成 RSW 密钥对失败，请稍后重试。",
    "failed_create_key": "创建密钥失败。",
    "failed_create_apikey": "创建 API 密钥失败。",
    "download_failed": "下载失败",

    "create_key_title": "创建密钥",
    "key_name": "密钥名称",
    "enable_instrumentation": "启用插桩（推荐）",
    "block_headless": "尝试屏蔽无头浏览器",
    "restrict_origins_label": "限制允许的域名",
    "origins_hint": "仅这些域名可以请求该密钥的挑战。",
    "origin_placeholder": "example.com",

    "key_created_title": "密钥已创建",
    "site_key_label": "站点密钥",
    "secret_key_label": "密钥",
    "copy_secret_hint": "请务必复制你的密钥——它将不再显示。",

    "rotate_title": "轮换密钥？",
    "rotate_msg": "将生成一个新的密钥。现有的集成将停止工作，直到更新。",
    "rotated_title": "密钥已轮换",
    "new_secret_key": "新密钥",
    "copy_new_secret_hint": "请务必复制——它将不再显示。",

    "delete_key_title": "删除密钥？",
    "delete_key_msg": "此操作将永久删除该密钥及其所有关联数据，无法撤销。",

    "add_block_rule": "添加封禁规则",
    "type": "类型",
    "ip_address": "IP 地址",
    "ip_range": "IP 范围（CIDR）",
    "asn_option": "ASN",
    "country_option": "国家",
    "ip_value": "IP 地址",
    "ip_range_value": "IP 范围（CIDR）",
    "asn_value": "ASN 号码或名称",
    "country_value": "值",
    "country_code": "国家代码",
    "ip_placeholder": "例如 1.2.3.4",
    "cidr_placeholder": "例如 10.0.0.0/8",
    "asn_placeholder": "例如 AS15169",
    "duration": "时长",
    "perm_option": "永久",
    "hour_1": "1 小时",
    "hours_24": "24 小时",
    "days_7": "7 天",
    "days_30": "30 天",
    "select_country": "选择国家…",

    "site_key_dialog": "站点密钥",

    "settings_sessions": "会话",
    "settings_security": "安全",
    "settings_ip_data": "IP 数据",
    "settings_api_keys": "API 密钥",
    "settings_about": "关于",

    "global_rate_limit": "全局速率限制",
    "global_rate_desc": "应用于所有挑战端点的默认速率限制。各密钥可在其配置中单独覆盖。",
    "requests_per_window": "每个时间窗口允许的请求数",
    "window_hint": "时间窗口（毫秒，例如 5000 = 5 秒）",
    "global_origins_hint": "仅这些域名可以请求挑战。各密钥可单独覆盖。",
    "global_filtering_desc": "拦截看起来非真实浏览器的请求。各密钥可覆盖这些默认值。",

    "ip_header": "IP 标头",
    "ip_header_desc": "设置反向代理用于传递客户端真实 IP 的标头。用于速率限制、IP 追踪和地理位置查询。",
    "presets": "预设",
    "cloudflare": "Cloudflare",
    "vercel": "Vercel",
    "nginx": "Nginx",
    "clear": "清除",
    "ip_header_label": "IP 标头",
    "ip_header_placeholder": "例如 CF-Connecting-IP",
    "country_asn": "国家和 ASN 数据",
    "country_asn_desc": "选择如何解析每个 IP 的国家和 ASN。如果反向代理提供了标头则使用标头，或下载 IP 数据库进行自动查询。",
    "tab_ip_database": "IP 数据库",
    "tab_proxy_headers": "代理标头",
    "provider": "提供商",
    "dbip_lite": "DB-IP Lite（免费，无需密钥）",
    "maxmind": "MaxMind GeoLite2（免费，需要许可证密钥）",
    "ipinfo": "IPInfo（API，需要 Token）",
    "maxmind_account": "MaxMind 账户 ID",
    "maxmind_account_placeholder": "你的 MaxMind 账户 ID",
    "maxmind_license": "MaxMind 许可证密钥",
    "maxmind_license_placeholder": "你的 GeoLite2 许可证密钥",
    "ipinfo_token": "IPInfo Token",
    "ipinfo_token_placeholder": "你的 IPInfo API Token",
    "download_activate": "下载并激活",
    "update": "更新",
    "delete_db": "删除",
    "downloading": "下载中…",
    "downloading_file": "正在下载 {0}… {1}%",
    "downloading_kb": "正在下载 {0}… {1} KB",
    "starting_download": "开始下载…",
    "updating": "更新中…",
    "country_header": "国家标头",
    "country_header_placeholder": "例如 CF-IPCountry",
    "country_header_hint": "包含两位 ISO 国家代码的标头",
    "asn_header": "ASN / 网络标头",
    "asn_header_placeholder": "例如 CF-IPOrg",
    "asn_header_hint": "包含 ASN 或网络名称的标头",

    "current": "当前",
    "logout": "退出登录",
    "expires": "到期 {0}",

    "no_api_keys": "暂无 API 密钥",
    "key_id_meta": "{0}… · 创建于 {1}",

    "star_on_github": "在 GitHub 上点赞",
    "version_info": "独立版 v{0}<br>Node.js",
    "demo_mode_badge": "演示模式",

    "create_apikey_title": "创建 API 密钥",
    "apikey_name": "密钥名称",
    "apikey_created_title": "API 密钥已创建",
    "apikey_label": "API 密钥",
    "apikey_hint": "请务必复制你的 API 密钥——它将不再显示。",
    "delete_apikey_title": "删除 API 密钥？",
    "delete_apikey_msg": "此操作将永久删除该 API 密钥。",
    "delete_ipdb_title": "删除 IP 数据库？",
    "delete_ipdb_msg": "将删除已下载的 IP 数据库文件。如果没有配置标头，国家和 ASN 查询将停止工作。",

    "location": "地理位置",
    "networks": "网络",
    "platform": "平台",
    "os": "操作系统",
    "list_view": "列表视图",
    "map_view": "地图视图",
    "search_networks": "搜索网络",
    "filter_networks": "筛选网络…",
    "no_location_no_source": "在 IP 数据设置中配置查询来源以存储地理位置数据。",
    "no_location_has_source": "暂无地理位置数据。",
    "no_network_no_source": "在 IP 数据设置中配置查询来源以存储网络数据。",
    "no_network_has_source": "暂无网络数据。",
    "no_platform_data": "暂无平台数据。",
    "no_os_data": "暂无操作系统数据。",
    "failed_load_map": "加载地图数据失败",

    "map_tooltip": "{0} • {1} 次挑战",

    "dbip_name": "DB-IP Lite",
    "maxmind_name": "MaxMind GeoLite2",
    "ipinfo_name": "IPInfo API",
    "updated_relative": "更新于 {0}",
    "country_size": "国家：{0}（已加载）",
    "asn_size": "ASN：{0}（已加载）",

    "year": "年",
    "years": "年",
    "month": "个月",
    "months": "个月",
    "week": "周",
    "weeks": "周",
    "day": "天",
    "days": "天",
    "hour": "小时",
    "hours": "小时",
    "minute": "分钟",
    "minutes": "分钟",
    "n_unit_ago": "{0}{1}前",
    "in_n_unit": "{0}{1}后",
    "just_now": "刚刚",
    "in_a_moment": "即将",

    "preparing_rsw": "正在准备 RSW 密钥对…",

    "challenges": "挑战",
  },
};

let currentLang = "en";

function _t(key, ...args) {
  const str = LANG[currentLang]?.[key] || LANG.en[key];
  if (str === undefined) return key;
  if (args.length) {
    return str.replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined ? String(args[i]) : m));
  }
  return str;
}

function _tp(key, n, ...args) {
  const pluralKey = currentLang === "zh" ? key : (n === 1 ? key : key + "s");
  return _t(pluralKey, n, ...args);
}

function setLang(lang) {
  if (!LANG[lang]) return;
  currentLang = lang;
  localStorage.setItem("cap_lang", lang);
  applyI18n();
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = _t(key);
    } else {
      el.textContent = _t(key);
    }
  });
}

(function initLang() {
  const saved = localStorage.getItem("cap_lang");
  if (saved && LANG[saved]) {
    currentLang = saved;
  } else {
    currentLang = navigator.language?.startsWith("zh") ? "zh" : "en";
  }
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
})();

window._t = _t;
window._tp = _tp;
window.setLang = setLang;
window.applyI18n = applyI18n;
