/**
 * Media Warehouse Core Spider
 * Version: 2.1.0-Release
 */

const HOST = 'https://222.aatck.cc';
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let siteKey = '';
let siteType = 0;

// Base64 解码器
function b64Decode(str) {
    if (!str) return '';
    str = String(str).trim().replace(/[\r\n\s]/g, '');
    if (typeof atob === 'function') {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            try { return atob(str); } catch (e2) {}
        }
    }
    try {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        str = str.replace(/=+$/, '');
        if (str.length % 4 === 1) return '';
        for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++);) {
            buffer = chars.indexOf(buffer);
            if (~buffer) {
                bs = bc % 4 ? bs * 64 + buffer : buffer;
                if (bc++ % 4) {
                    output += String.fromCharCode(255 & bs >> (-2 * bc & 6));
                }
            }
        }
        try {
            return decodeURIComponent(escape(output));
        } catch (e) {
            return output;
        }
    } catch (e) {
        return '';
    }
}

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
                'Referer': HOST + '/'
            }
        });
        return getResponseContent(res);
    } catch (e) {
        return '';
    }
}

// 变量提取
function gp(h, k) {
    if (!h) return '';
    let reg = new RegExp('\\b' + k + "\\s*=\\s*['\"]([^'\"]+)['\"]", 'i');
    let m = String(h).match(reg);
    return m ? m[1] : '';
}

// 解密结果提取
function extractU(raw) {
    if (!raw) return '';
    if (typeof raw === 'object' && raw.u) {
        return b64Decode(raw.u);
    }
    let str = typeof raw === 'string' ? raw : JSON.stringify(raw);
    try {
        let j = JSON.parse(str);
        if (j && j.u) return b64Decode(j.u);
        if (j && j.content) return extractU(j.content);
    } catch (e) {}

    let m = str.match(/\\?["']u\\?["']\s*:\s*\\?["']([^"'\\]+)/);
    if (m) {
        return b64Decode(m[1]);
    }
    return '';
}

// POST 鉴权解密
async function postCount(countUrl, detailUrl, aid, asid, anid, ak) {
    let timestamp = Date.now();
    let bodyStr = `id=${encodeURIComponent(aid)}&sid=${encodeURIComponent(asid)}&nid=${encodeURIComponent(anid)}&tk=${encodeURIComponent(ak)}&g=1&x=180&y=320&dt=1200&sw=1080&sh=1920&tz=-480&t=${timestamp}`;
    
    let bodyObj = {
        id: String(aid),
        sid: String(asid),
        nid: String(anid),
        tk: String(ak),
        g: '1',
        x: '180',
        y: '320',
        dt: '1200',
        sw: '1080',
        sh: '1920',
        tz: '-480',
        t: String(timestamp)
    };

    let headers = {
        'User-Agent': DEFAULT_UA,
        'Referer': detailUrl,
        'Origin': HOST,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json, text/javascript, */*; q=0.01'
    };

    try {
        let res = await req(countUrl, {
            method: 'post',
            headers: headers,
            data: bodyObj,
            postType: 'form'
        });
        let u = extractU(res);
        if (u) return u;
    } catch (e) {}

    try {
        let res = await req(countUrl, {
            method: 'POST',
            headers: headers,
            data: bodyStr,
            body: bodyStr
        });
        let u = extractU(res);
        if (u) return u;
    } catch (e) {}

    try {
        if (typeof post === 'function') {
            let res = await post(countUrl, bodyStr, headers);
            let u = extractU(res);
            if (u) return u;
        }
    } catch (e) {}

    return '';
}

async function init(cfg) {
    siteKey = cfg.skey;
    siteType = cfg.stype;
}

// 分类隐晦化展示
async function home(filter) {
    return JSON.stringify({
        class: [
            { type_id: '2', type_name: '国产专区' },
            { type_id: '1', type_name: '日韩剧场' },
            { type_id: '3', type_name: '欧美精选' },
            { type_id: 'hits', type_name: '热播推荐' }
        ]
    });
}

async function homeVod() {
    return await category('hits', '1', false, {});
}

async function category(tid, pg, filter, extend) {
    let page = pg || '1';
    let url = tid === 'hits' 
        ? `${HOST}/vodshow/1--hits------${page}---.html` 
        : (page === '1' ? `${HOST}/vodtype/${tid}.html` : `${HOST}/vodtype/${tid}-${page}.html`);

    let html = await request(url);
    let vods = [];

    let items = html.split(/<div\s+class=["'][^"']*stui-vodlist__box[^"']*["']/i);
    for (let i = 1; i < items.length; i++) {
        let item = items[i];
        let idM = item.match(/href=["']\/(?:v5\/)?(\d+)(?:-1-1)?\.html["']/i);
        let titleM = item.match(/<h4[^>]*class=["']title["'][^>]*><a[^>]*>([^<]+)<\/a>/i) ||
                     item.match(/title=["']([^"']+)["']/i);
        let picM = item.match(/(?:data-original|src)=["']([^"']+\.(?:jpg|png|jpeg|webp))["']/i);
        let remM = item.match(/<span\s+class=["']pic-text[^"']*["']>([^<]+)<\/span>/i);

        if (idM && titleM && picM) {
            let id = idM[1];
            let title = titleM[1].trim();
            let pic = picM[1];
            if (!pic.startsWith('http')) pic = HOST + pic;

            if (!vods.some(v => v.vod_id === id)) {
                vods.push({
                    vod_id: id,
                    vod_name: title,
                    vod_pic: pic,
                    vod_remarks: remM ? remM[1].trim() : ''
                });
            }
        }
    }

    return JSON.stringify({
        page: parseInt(page),
        pagecount: 999,
        limit: vods.length,
        total: 999,
        list: vods
    });
}

async function detail(id) {
    let vid = id;
    if (vid.includes('/')) {
        let m = vid.match(/(\d+)/);
        if (m) vid = m[1];
    }

    let detailUrl = `${HOST}/v5/${vid}-1-1.html`;
    let html = await request(detailUrl);

    let titleMatch = html.match(/<h3[^>]*class=["']title["'][^>]*>([^<]+)<\/h3>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<title>([^<]+)-/i);
    let title = titleMatch ? titleMatch[1].trim() : '视频播放';

    let picMatch = html.match(/(?:data-original|src)=["']([^"']+\.(?:jpg|png|jpeg|webp))["']/i);
    let pic = picMatch ? picMatch[1] : '';
    if (pic && !pic.startsWith('http')) pic = HOST + pic;

    let aid = gp(html, 'AID') || vid;
    let sid = gp(html, 'ASID') || '1';
    let nid = gp(html, 'ANID') || '1';
    let tk = gp(html, 'AK');
    if (!tk) {
        let akM = html.match(/\bAK\s*=\s*['"]([a-fA-F0-9]{32,})['"]/i);
        if (akM) tk = akM[1];
    }

    let playTarget = vid;
    if (aid && tk) {
        let realUrl = await postCount(`${HOST}/static/count.php`, detailUrl, aid, sid, nid, tk);
        if (realUrl) {
            playTarget = realUrl;
        }
    }

    return JSON.stringify({
        list: [{
            vod_id: vid,
            vod_name: title,
            vod_pic: pic,
            vod_play_from: '默认线路',
            vod_play_url: `正片$${playTarget}`
        }]
    });
}

async function search(wd, quick) {
    let searchUrl = `${HOST}/vodsearch/-------------.html?wd=${encodeURIComponent(wd)}`;
    let html = await request(searchUrl);
    let vods = [];

    let items = html.split(/<div\s+class=["'][^"']*stui-vodlist__box[^"']*["']/i);
    for (let i = 1; i < items.length; i++) {
        let item = items[i];
        let idM = item.match(/href=["']\/(?:v5\/)?(\d+)(?:-1-1)?\.html["']/i);
        let titleM = item.match(/<h4[^>]*class=["']title["'][^>]*><a[^>]*>([^<]+)<\/a>/i) ||
                     item.match(/title=["']([^"']+)["']/i);
        let picM = item.match(/(?:data-original|src)=["']([^"']+\.(?:jpg|png|jpeg|webp))["']/i);

        if (idM && titleM && picM) {
            let id = idM[1];
            let title = titleM[1].trim();
            let pic = picM[1];
            if (!pic.startsWith('http')) pic = HOST + pic;

            if (!vods.some(v => v.vod_id === id)) {
                vods.push({
                    vod_id: id,
                    vod_name: title,
                    vod_pic: pic,
                    vod_remarks: ''
                });
            }
        }
    }

    return JSON.stringify({ list: vods });
}

async function play(flag, id, flags) {
    let realPlayUrl = '';

    if (id.startsWith('http://') || id.startsWith('https://')) {
        realPlayUrl = id;
    } else {
        let vid = id;
        let detailUrl = `${HOST}/v5/${vid}-1-1.html`;
        let html = await request(detailUrl);
        let aid = gp(html, 'AID') || vid;
        let sid = gp(html, 'ASID') || '1';
        let nid = gp(html, 'ANID') || '1';
        let tk = gp(html, 'AK') || (html.match(/\bAK\s*=\s*['"]([a-fA-F0-9]{32,})['"]/i) || [])[1];

        if (aid && tk) {
            realPlayUrl = await postCount(`${HOST}/static/count.php`, detailUrl, aid, sid, nid, tk);
        }
    }

    if (realPlayUrl) {
        realPlayUrl = realPlayUrl.trim().replace(/[\r\n]/g, '');
        if (realPlayUrl.startsWith('/')) realPlayUrl = HOST + realPlayUrl;
    }

    return JSON.stringify({
        parse: 0,
        url: realPlayUrl,
        header: {
            'User-Agent': DEFAULT_UA,
            'Referer': HOST + '/',
            'Origin': HOST
        }
    });
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search
    };
}
