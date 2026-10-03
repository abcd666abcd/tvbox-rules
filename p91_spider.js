/**
 * Digital Original Media Spider
 * Version: 1.0.1-Production
 * Standards: CatVod / TVBox QuickJS Specification
 */

let HOST = 'https://91porn.com';
let IMG_HOST = 'https://raw.myvbox99.top/91-img';
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let siteKey = '';
let siteType = 0;

// 规范分类字典（纯数字 type_id）
const CATEGORY_MAP = {
    '1': { name: '当前最热', cat: 'hot' },
    '2': { name: '本月最热', cat: 'top' },
    '3': { name: '原创精选', cat: 'ori' },
    '4': { name: '最近加精', cat: 'rf' },
    '5': { name: '高清专区', cat: 'hd' },
    '6': { name: '10分钟+', cat: 'long' },
    '7': { name: '20分钟+', cat: 'longer' },
    '8': { name: '本月收藏', cat: 'tf' },
    '9': { name: '收藏最多', cat: 'mf' },
    '10': { name: '本月讨论', cat: 'md' }
};

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
                'Referer': HOST + '/',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Cookie': 'language=cn_CN'
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
    let items = html.split(/<div\s+class=["'][^"']*col-xs-12[^"']*["']/i);
    for (let i = 1; i < items.length; i++) {
        let chunk = items[i];

        // 关键过滤：剔除站方置顶竞价推广与错位卡片 (包含 c=auct / c=aaxbms 或容器为 col-lg-8)
        if (chunk.includes('col-lg-8') || chunk.includes('c=auct') || chunk.includes('c=aaxbms')) {
            continue;
        }

        // 兼容匹配普通视频 view_video.php 与高清专区 view_video_hd.php
        let idM = chunk.match(/view_video(?:_hd)?\.php\?viewkey=([a-zA-Z0-9]+)/i);
        let titleM = chunk.match(/video-title[^>]*>([\s\S]*?)<\/a>/i);
        let picM = chunk.match(/src=["'](https?:\/\/[^"']*\/thumb\/(\d+)\.jpg)["']/i);
        let durM = chunk.match(/<span\s+class=["']duration["']>([^<]+)<\/span>/i);
        let hdM = /class=["'][^"']*hd-text-icon[^"']*["']/i.test(chunk);
        let authorM = chunk.match(/<span\s+class=["']info["']>([^<]*作者[^<]*)<\/span>\s*([\s\S]*?)<br/i);

        if (idM && titleM) {
            let vid = idM[1];
            let title = titleM[1].replace(/<[^>]+>/g, '').replace(/\?\/?span>/g, '').trim();
            let pic = picM ? `${IMG_HOST}/${picM[2]}.jpg` : '';
            let dur = durM ? durM[1].trim() : '';
            let author = authorM ? authorM[2].replace(/<[^>]+>/g, '').trim() : '';
            let rem = (hdM ? 'HD ' : '') + dur + (author ? ' · ' + author : '');

            if (!vods.some(v => v.vod_id === vid)) {
                vods.push({
                    vod_id: vid,
                    vod_name: title || ('视频 ' + vid),
                    vod_pic: pic,
                    vod_remarks: rem.trim()
                });
            }
        }
    }
    return vods;
}

async function init(cfg) {
    if (cfg) {
        siteKey = cfg.skey || '';
        siteType = cfg.stype || 0;
    }
}

// 动态输出分类字典
async function home(filter) {
    let classes = [];
    for (let k in CATEGORY_MAP) {
        classes.push({
            type_id: k,
            type_name: CATEGORY_MAP[k].name
        });
    }
    return JSON.stringify({
        class: classes
    });
}

// 客户端原生「推荐」Tab 接管：默认展示当前最热
async function homeVod() {
    return await category('1', '1', false, {});
}

async function category(tid, pg, filter, extend) {
    let page = parseInt(pg || '1');
    let conf = CATEGORY_MAP[String(tid)] || CATEGORY_MAP['1'];
    let cat = conf.cat;
    let url = `${HOST}/v.php?category=${cat}&viewtype=basic&page=${page}`;

    let html = await request(url);
    let vods = parseCards(html);
    let hasNext = /rel=["']next["']/i.test(html) || /下一页/.test(html) || vods.length >= 20;

    return JSON.stringify({
        page: page,
        pagecount: hasNext ? page + 1 : page,
        limit: vods.length,
        total: 9999,
        list: vods
    });
}

async function detail(id) {
    let vid = String(id);
    let detailUrl = `${HOST}/view_video.php?viewkey=${vid}`;
    let html = await request(detailUrl);

    let streamUrl = '';
    let encM = html.match(/strencode2\("([^"]+)"\)/);
    if (encM) {
        let decoded = '';
        try {
            decoded = decodeURIComponent(encM[1]);
        } catch (e) {
            decoded = unescape(encM[1]);
        }
        let srcM = decoded.match(/src=['"]([^'"]+\.mp4\?[^'"]+)['"]/i) ||
                   decoded.match(/src=['"]([^'"]+)['"]/i);
        if (srcM) {
            streamUrl = srcM[1];
        }
    }

    let titleMatch = html.match(/<h4[^>]*class=["'][^"']*login_register_header[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `视频 ${vid}`;

    let pic = '';
    let posterM = html.match(/poster=["'](https?:\/\/[^"']*\/thumb\/(\d+)\.jpg)["']/i);
    if (posterM) {
        pic = `${IMG_HOST}/${posterM[2]}.jpg`;
    }

    let actorMatch = html.match(/href=["']uprofile\.php\?UID=[^"']+["'][^>]*>([\s\S]*?)<\/a>/i);
    let actor = actorMatch ? actorMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    return JSON.stringify({
        list: [{
            vod_id: vid,
            vod_name: title,
            vod_pic: pic,
            vod_actor: actor,
            vod_content: title,
            vod_play_from: '默认专线',
            vod_play_url: `正片$${streamUrl}`
        }]
    });
}

async function search(wd, quick, pg) {
    let page = parseInt(pg || '1');
    let url = `${HOST}/search_result.php?search_id=${encodeURIComponent(wd)}&search_type=search_videos&page=${page}`;
    let html = await request(url);
    let vods = parseCards(html);
    let hasNext = /rel=["']next["']/i.test(html) || /下一页/.test(html) || vods.length >= 20;

    return JSON.stringify({
        page: page,
        pagecount: hasNext ? page + 1 : page,
        limit: vods.length,
        total: 9999,
        list: vods
    });
}

async function play(flag, id, flags) {
    return JSON.stringify({
        parse: 0,
        url: id
    });
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        search: search,
        play: play
    };
}
