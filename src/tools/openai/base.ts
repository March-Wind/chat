import { AxiosRequestConfig } from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { OpenAIApi, Configuration } from 'openai';
import { openai_key, proxy } from '../../env';
const httpsAgent = proxy && new SocksProxyAgent(proxy);
interface Params {
  apiKey?: string;
}
class IOpenAI {
  openai: OpenAIApi;
  protected axiosRequestConfig: AxiosRequestConfig;

  constructor(params: Params) {
    const configuration = new Configuration({
      apiKey: params.apiKey || openai_key,
    });
    this.openai = new OpenAIApi(configuration);
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
