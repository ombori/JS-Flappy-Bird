type MobileEndpointItem = {
  id: string;
  urlId: string;
  displayName: string;
  env: string;
  url: string;
  notes: string;
}

type MobileEndpoint = {
  prod: MobileEndpointItem;
  [env: string]: MobileEndpointItem;
}

/**
 * @title App settings
 */
export type Schema = {
  /**
   * @title Mobile Endpoint
   * @ui mobileEndpointPicker
   */
  remote: MobileEndpoint;
}