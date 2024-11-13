import { AnyUpdateContext } from '../context';

export type Response = {
  respond(ctx: AnyUpdateContext): Promise<void>;
};
