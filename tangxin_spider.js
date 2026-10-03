/**
 * Tangxin Media Core Spider
 * Version: 1.1.0-DirectRelease (Mainland China Direct Optimized)
 * Standards: CatVod / TVBox QuickJS Specification
 */

let HOST = 'https://raw.myvbox99.top/tx';
let ORIGIN = 'https://tangxinvlog.app';
let CDN = 'https://t.5gcdn.xyz';
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let siteKey = '';
let siteType = 0;

// 递归解包
function getResponseContent(res) {
    if (!res) return '';
    if (typeof res === 'object') {
        if (res.content !== undefined) return getResponseContent(res.content);
        if (res.body !== undefined) return getResponseContent(res.body);
        if (res.data !== undefined) return getResponseContent(res.data);
        return JSON.stringify(res);
    }
    if (typeof res === 'string') {
        let trimmed = res.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                let parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.content !== undefined) return getResponseContent(parsed.content);
                    if (parsed.body !== undefined) return getResponseContent(parsed.body);
                    if (parsed.data !== undefined && typeof parsed.data === 'string') return getResponseContent(parsed.data);
                }
            } catch (e) {}
        }
        return res;
    }
    return String(res);
}

// GET 网络请求
async function request(reqUrl) {
    try {
        let res = await req(reqUrl, {
            method: 'get',
            headers: {
                'User-Agent': DEFAULT_UA,
                'Referer': ORIGIN + '/'
            }
        });
        return getResponseContent(res);
    } catch (e) {
        return '';
    }
}

// 物理切块解析卡片列表
function parseCards(html) {
    let vods = [];
    if (!html) return vods;
    let items = html.split(/<article\s+class=["'][^"']*card[^"']*["']/i);
    for (let i = 1; i < items.length; i++) {
        let chunk = items[i];
        let idM = chunk.match(/href=["']\/v\/(\d+)\/["']/i);
        let titleM = chunk.match(/aria-label=["']([^"']+)["']/i) ||
                     chunk.match(/<h3[^>]*class=["']title["'][^>]*>\s*<a[^>]*>([^<]+)<\/a>/i);
        let durM = chunk.match(/class=["']duration["'][^>]*>([^<]+)<\/span>/i);
        let picM = chunk.match(/src=["'](https?:\/\/[^"']+cover\.jpg)["']/i);
        let nickM = chunk.match(/class=["']nickname["'][^>]*>([\s\S]*?)<\/a>/i);

        if (idM) {
            let id = idM[1];
            let title = titleM ? titleM[1].trim() : ('作品 ' + id);
            let pic = picM ? picM[1] : (`${CDN}/videos/${id}/cover.jpg`);
            let dur = durM ? durM[1].trim() : '';
            let nick = nickM ? nickM[1].replace(/<[^>]+>/g, '').replace(/^@\s*/, '').trim() : '';
            let rem = dur + (nick ? ' · ' + nick : '');

            if (!vods.some(v => v.vod_id === id)) {
                vods.push({
                    vod_id: id,
                    vod_name: title,
                    vod_pic: pic,
                    vod_remarks: rem
                });
            }
        }
    }
    return vods;
}

async function init(cfg) {
    siteKey = cfg.skey;
    siteType = cfg.stype;
}

// 动态输出知名创作者与精选分类（按用户要求侧重创作者专栏）
async function home(filter) {
    return JSON.stringify({
        class: [
            { type_id: 'featured', type_name: '精选合辑' },
            { type_id: 'a/Yuzukitty柚子猫', type_name: '柚子猫' },
            { type_id: 'a/桥本香菜', type_name: '桥本香菜' },
            { type_id: 'a/小欣奈', type_name: '小欣奈' },
            { type_id: 'a/饼干姐姐', type_name: '饼干姐姐' },
            { type_id: 'a/星野兔', type_name: '星野兔' },
            { type_id: 'a/Sweetie Fox(小狐狸)', type_name: '小狐狸' },
            { type_id: 'a/Nana_taipei', type_name: 'Nana' },
            { type_id: 'a/小野整活部', type_name: '整活工坊' },
            { type_id: 'a/糖心AI创意短剧', type_name: 'AI短剧' },
            { type_id: 'a/极限反差团', type_name: '反差剧场' },
            { type_id: 'a/星空无限传媒', type_name: '星空专区' },
            { type_id: 'a/爱豆传媒', type_name: '爱豆专区' },
            { type_id: 'tag/cospaly', type_name: '二次元漫剪' }
        ]
    });
}

async function homeVod() {
    return await category('featured', '1', false, {});
}

async function category(tid, pg, filter, extend) {
    let page = parseInt(pg || '1');
    let url = '';

    if (tid === 'featured') {
        url = page === 1 ? `${HOST}/featured/` : `${HOST}/featured/${page}/`;
    } else if (tid.startsWith('a/') || tid.startsWith('tag/')) {
        let parts = tid.split('/');
        let prefix = parts[0];
        let slug = encodeURIComponent(parts.slice(1).join('/'));
        url = page === 1 ? `${HOST}/${prefix}/${slug}/` : `${HOST}/${prefix}/${slug}/${page}/`;
    } else {
        url = page === 1 ? `${HOST}/featured/` : `${HOST}/featured/${page}/`;
    }

    let html = await request(url);
    let vods = parseCards(html);
    let hasNext = /rel=["']next["']/i.test(html) || /下一页/.test(html) || vods.length >= 24;

    return JSON.stringify({
        page: page,
        pagecount: hasNext ? page + 1 : page,
        limit: vods.length,
        total: 9999,
        list: vods
    });
}

async function detail(id) {
    let vid = id;
    if (vid.includes('/')) {
        let m = vid.match(/(\d+)/);
        if (m) vid = m[1];
    }

    let detailUrl = `${HOST}/v/${vid}/`;
    let html = await request(detailUrl);

    let titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `视频 ${vid}`;

    let picMatch = html.match(/src=["'](https?:\/\/[^"']+cover\.jpg)["']/i);
    let pic = picMatch ? picMatch[1] : `${CDN}/videos/${vid}/cover.jpg`;

    let descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    let desc = descMatch ? descMatch[1].trim() : '';

    let actorMatch = html.match(/href=["']\/a\/[^"']+\/["'][^>]*>([\s\S]*?)<\/a>/i);
    let actor = actorMatch ? actorMatch[1].replace(/<[^>]+>/g, '').replace(/^@\s*/, '').trim() : '';

    // 0ms 前置组装免解密直链（国内直连 CDN 秒开）
    let streamUrl = `${CDN}/videos/${vid}/index.m3u8`;

    return JSON.stringify({
        list: [{
            vod_id: vid,
            vod_name: title,
            vod_pic: pic,
            vod_actor: actor,
            vod_content: desc,
            vod_play_from: '极速专线',
            vod_play_url: `正片$${streamUrl}`
        }]
    });
}

async function search(wd, quick) {
    if (!wd) return JSON.stringify({ list: [] });
    let trimmed = wd.trim();

    // 优先尝试演员/创作者专栏
    let actorUrl = `${HOST}/a/${encodeURIComponent(trimmed)}/`;
    let html = await request(actorUrl);
    let vods = parseCards(html);

    // 次选尝试标签分类
    if (vods.length === 0) {
        let tagUrl = `${HOST}/tag/${encodeURIComponent(trimmed)}/`;
        let tagHtml = await request(tagUrl);
        vods = parseCards(tagHtml);
    }

    return JSON.stringify({ list: vods });
}

async function play(flag, id, flags) {
    let playUrl = id;
    if (!playUrl.startsWith('http://') && !playUrl.startsWith('https://')) {
        playUrl = `${CDN}/videos/${id}/index.m3u8`;
    }

    return JSON.stringify({
        parse: 0,
        url: playUrl,
        header: {
            'User-Agent': DEFAULT_UA,
            'Referer': ORIGIN + '/'
        }
    });
}
