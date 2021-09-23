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

  /**
   * @title Gravity
   * @default 1.0
   */
  gravity: number;

  /**
   * @title Pipe gap
   * @default 85
   */
  gap: number;

  /**
   * @title Flap acceleration
   * @default 3.6
   */
  thrust: number;
}