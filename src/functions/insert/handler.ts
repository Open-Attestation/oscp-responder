import createError from "http-errors";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { putItem } from "@services/dynamoDb";

import schema from "./schema";

const REASON_CODES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1001];

const insert: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const { documentHash, reasonCode } = event.body;

  if (!documentHash || reasonCode === undefined) {
    throw new createError.BadRequest(`documentHash (string) and reasonCode (number) required`);
  } else if (!REASON_CODES.includes(reasonCode)) {
    throw new createError.BadRequest(`Invalid reasonCode. Please use one of the following values: ${REASON_CODES}`);
  }

  try{
    await putItem({
      TableName: process.env.REVOCATION_TABLE,
      Item: { documentHash, reasonCode },
    })
  } catch (e){
    throw new createError.InternalServerError(e);
  }

  return formatJSONResponse({
    success: true,
    documentHash,
    message: "documentHash inserted into revocation table",
  });
};

export const main = middyfy(insert);
