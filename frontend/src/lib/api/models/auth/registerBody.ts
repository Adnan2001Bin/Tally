/**
 * Auth register payload — keep in sync with backend OpenAPI.
 */
export interface RegisterBody {
  /** @maxLength 255 */
  email: string;
  /**
   * @minLength 8
   * @maxLength 128
   */
  password: string;
  /**
   * @minLength 2
   * @maxLength 100
   */
  display_name: string;
  /**
   * @minLength 3
   * @maxLength 30
   * @pattern ^[a-zA-Z0-9_]{3,30}$
   */
  username?: string;
  /**
   * @minLength 5
   * @maxLength 20
   */
  phone?: string;
  /** @maxLength 255 */
  device_name?: string;
}
