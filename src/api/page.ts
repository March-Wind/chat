import { AxiosResponse } from 'axios';
import { PassThrough } from 'stream';
import Router, { Middleware } from '@koa/router';

const page = (router: Router) => {
  router.get('/page', (ctx) => {
    ctx.body = `
    <!DOCTYPE html>
  <html>
      <body>
      <h1>response:</h1>
      <div id="result"></div>
      <script>
      var source = new EventSource("/question?a=你好");
      source.onmessage = function(event) {
          document.getElementById("result").innerHTML += event.data + "<br>";
      };
      </script>
      </body>
  </html>
  `;
  });
};

export default page;
