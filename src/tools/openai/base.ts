import { AxiosRequestConfig } from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import OpenAI from 'openai';
import { openai_key, proxy } from '../../env';
const httpsAgent = proxy && new SocksProxyAgent(proxy);
interface Params {
  apiKey?: string;
}
class IOpenAI {
  openai: OpenAI;
  protected axiosRequestConfig: AxiosRequestConfig;

  constructor(params: Params) {
    this.openai = new OpenAI({
      apiKey: params.apiKey || openai_key,
    });
    Object.defineProperty(this, 'axiosRequestConfig', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: {
        httpsAgent,
        httpAgent: httpsAgent,
        proxy: false,
      },
    });
  }
}

export default IOpenAI;
