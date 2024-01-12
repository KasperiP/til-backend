/* eslint-disable no-console */
import { LogType } from '../../models';

export const logger = (
  message: string,
  type: LogType = LogType.INFO,
  content?: any,
): void => {
  const log = `${type.toUpperCase()}: ${message} ${
    content ? JSON.stringify(content) : ''
  }`;
  if (type === LogType.ERROR) {
    console.error(log);
  } else {
    console.log(log);
  }
};
