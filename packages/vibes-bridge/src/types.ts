export interface VibesConfig {
  [key: string]: any; // To be refined, holds legacy config
}

export interface VibesClient {
  session: {
    create(options: any): Promise<any>;
    get(options: any): Promise<any>;
    promptAsync(options: any): Promise<any>;
    prompt(options: any): Promise<any>;
    messages(options: any): Promise<any>;
    revert(options: any): Promise<any>;
    fork(options: any): Promise<any>;
    delete(options: any): Promise<any>;
    abort(options: any): Promise<any>;
    init(options: any): Promise<any>;
  };
  global: {
    event(options: any): AsyncIterable<any>;
  };
  config: {
    update(options: any): Promise<any>;
  };
  permission: {
    reply(options: any): Promise<any>;
  };
  question: {
    reply(options: any): Promise<any>;
    reject(options: any): Promise<any>;
  };
}
