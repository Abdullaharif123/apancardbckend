export default class ResponseService {
  static status = 200; // Default status code

  static responseService(state, responseData, message) {
    let responseObj = {
      metadata: {
        status: state,
        message: message,
        responseCode: this.status,
      },
      payload: {
        data: responseData,
      },
    };
    return responseObj;
  }
}
