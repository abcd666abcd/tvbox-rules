export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let target = url.pathname.replace(/^\/+/, '');

    if (!target) {
      return new Response('GitHub & Media Acceleration Proxy is active.', {
        headers: { 'content-type': 'text/plain;charset=utf-8' }
      });
    }

    // 封面图片反代（自动注入 Referer 与 UA 破除移动端原生控件 403 防盗链）
    if (target.startsWith('tx-img/') || target.startsWith('tx-img')) {
      const imgMatch = target.match(/(\d+)/);
      if (imgMatch) {
        const vid = imgMatch[1];
        const cdnImgUrl = `https://t.5gcdn.xyz/videos/${vid}/cover.jpg`;
        try {
          const resp = await fetch(cdnImgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://tangxinvlog.app/'
            }
          });
          const newHeaders = new Headers(resp.headers);
          newHeaders.set('Access-Control-Allow-Origin', '*');
          newHeaders.set('Content-Type', 'image/jpeg');
          newHeaders.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000'); // 边缘缓存 30 天
          return new Response(resp.body, {
            status: resp.status,
            headers: newHeaders
          });
        } catch (e) {
          return new Response(`Error proxying image: ${e.message}`, { status: 500 });
        }
      }
    }

    // 静态目录轻量反代 (专用于国内直连设备无感拉取 HTML 页面)
    if (target.startsWith('tx/') || target === 'tx') {
      const txPath = target.replace(/^tx\/?/, '');
      const txUrl = `https://tangxinvlog.app/${txPath}${url.search}`;
      try {
        const resp = await fetch(txUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9'
          }
        });
        const newHeaders = new Headers(resp.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Cache-Control', 'public, max-age=180');
        return new Response(resp.body, {
          status: resp.status,
          headers: newHeaders
        });
      } catch (e) {
        return new Response(`Error proxying tangxin: ${e.message}`, { status: 500 });
      }
    }

    // 91 封面图片反代（代拉 cdn77 并边缘缓存 30 天）
    if (target.startsWith('91-img/') || target.startsWith('91-img')) {
      const cleanPath = target.replace(/^91-img\/?/, '');
      const imgMatch = cleanPath.match(/(\d+)/);
      if (imgMatch) {
        const thumbId = imgMatch[1];
        const cdnImgUrl = `https://1729130453.rsc.cdn77.org/thumb/${thumbId}.jpg`;
        try {
          const resp = await fetch(cdnImgUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          const newHeaders = new Headers(resp.headers);
          newHeaders.set('Access-Control-Allow-Origin', '*');
          newHeaders.set('Content-Type', 'image/jpeg');
          newHeaders.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000');
          newHeaders.delete('Content-Encoding');
          return new Response(resp.body, {
            status: resp.status,
            headers: newHeaders
          });
        } catch (e) {
          return new Response(`Error proxying 91 image: ${e.message}`, { status: 500 });
        }
      }
    }

    // 91 页面轻量反代 (列表、搜索与详情页)
    if (target.startsWith('91/') || target === '91') {
      const p91Path = target.replace(/^91\/?/, '');
      const p91Url = `https://91porn.com/${p91Path}${url.search}`;
      try {
        const resp = await fetch(p91Url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://91porn.com/',
            'Cookie': 'language=cn_CN'
          }
        });
        const html = await resp.text();
        if (!html || html.length < 100) {
          return new Response(JSON.stringify({
            url: p91Url,
            status: resp.status,
            statusText: resp.statusText,
            headers: Object.fromEntries(resp.headers.entries()),
            bodySample: html
          }, null, 2), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        return new Response(html, {
          status: resp.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'public, max-age=120'
          }
        });
      } catch (e) {
        return new Response(`Error proxying 91: ${e.message}`, { status: 500 });
      }
    }

    // 支持各种前缀传入形式
    target = target.replace(/^https?:\/\/(raw\.githubusercontent\.com|github\.com)\//, '');
    
    // 携带 url.search 及微秒时间戳，彻底打穿 GitHub Fastly 边缘缓存
    const sep = url.search ? '&' : '?';
    const githubRawUrl = `https://raw.githubusercontent.com/${target}${url.search}${sep}_t=${Date.now()}`;

    try {
      const resp = await fetch(githubRawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      const newHeaders = new Headers(resp.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      newHeaders.set('X-Worker-Debug', 'gh-proxy-hub-v2');
      newHeaders.delete('Age');
      newHeaders.delete('Expires');

      return new Response(resp.body, {
        status: resp.status,
        headers: newHeaders
      });
    } catch (e) {
      return new Response(`Error fetching: ${e.message}`, { status: 500 });
    }
  }
};
