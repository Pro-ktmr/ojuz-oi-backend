import http from 'http';
import fetch, { AbortError } from 'node-fetch';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

const PORT = process.env.PORT || 3000;
const TIME_RETRY = 3;

const server = http.createServer(async (request, response) => {
    response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Request-Method': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET',
        'Access-Control-Allow-Headers': '*',
    });
    const handleName = request.url.slice(1);

    let fetchHtml = '';
    for (let i = 0; i < TIME_RETRY; i++) {
        const AbortController = globalThis.AbortController || await import('abort-controller');
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 1000);
        try {
            const fetchResponse = await fetch(`https://oj.uz/profile/${handleName}`, {
                method: 'GET',
                signal: controller.signal,
            });
            fetchHtml = await fetchResponse.text();
        }
        catch (e) {
            if (e instanceof AbortError) {
                console.log('AbortError');
            }
            else {
                console.log(e);
            }
        }
        finally {
            clearTimeout(timeout);
        }
        if (fetchHtml != '') {
            break;
        }
    }

    const dom = new JSDOM(fetchHtml);
    const document = dom.window.document;
    const acTaskList = document.querySelectorAll('#content div.panel.panel-default:nth-child(1) td');
    const acTaskListArray = Array.from(acTaskList, td => td.textContent.trim()).filter(Boolean);
    const waTaskList = document.querySelectorAll('#content div.panel.panel-default:nth-child(2) td');
    const waTaskListArray = Array.from(waTaskList, td => td.textContent.trim()).filter(Boolean);

    response.end(JSON.stringify({
        'ac': acTaskListArray,
        'wa': waTaskListArray,
    }));
});

server.listen(PORT);

console.log('ready...');
