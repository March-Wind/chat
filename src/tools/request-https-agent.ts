import SocksProxyAgent from 'socks-proxy-agent';

/** 主要是用时socks5来替代https */
import axios from 'axios';
const instance = axios.create({});
const httpsAgent = new SocksProxyAgent.SocksProxyAgent('socks5://127.0.0.1:1086');
const google = 'https://www.google.com/';
instance
  .get(google, {
    httpsAgent,
  })
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
