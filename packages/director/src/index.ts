// organize-imports-ignore
import 'source-map-support/register';
import type * as lambda from 'aws-lambda';
import 'source-map-support/register';
import { init as initHooks } from '@sorry-cypress/director/lib/hooks/init';
// import { getLogger } from '@sorry-cypress/logger';
import { app } from './app';
// import { PORT } from './config';
import { getExecutionDriver, getScreenshotsDriver } from './drivers';
// import { createServer, proxy } from 'aws-serverless-express';
import serverlessExpress from '@vendia/serverless-express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const serverlessExpress = require('@vendia/serverless-express');

// async function main() {
//   await initHooks();
//   await getExecutionDriver();
//   await getScreenshotsDriver();

//   app.on('error', (error) => {
//     throw error;
//   });
//   app.listen(PORT, async () => {
//     getLogger().log(
//       `🚀 Director service is ready at http://0.0.0.0:${PORT}/...`
//     );
//   });
// }

app.disable('x-powered-by');

// process.on('uncaughtException', (err) => {
//   console.error(err, 'uncaughtException');
//   process.exit(1);
// });

// process.on('unhandledRejection', (err) => {
//   console.error(err, 'unhandledRejection');
//   process.exit(1);
// });

// main().catch(async (error) => {
//   getLogger().error(error);
//   process.exit(1);
// });

export * from './types';

let serverlessExpressInstance;

const setup = async (
  event: lambda.APIGatewayProxyEvent,
  context: lambda.Context
) => {
  await initHooks();
  await getExecutionDriver();
  await getScreenshotsDriver();
  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
};

export const handler = async (
  event: lambda.APIGatewayProxyEvent,
  context: lambda.Context
) => {
  if (serverlessExpressInstance)
    return serverlessExpressInstance(event, context);
  return setup(event, context);
};
