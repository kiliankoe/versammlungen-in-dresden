// Publisher interface will be defined here
import { Assembly } from "./assembly";

export interface Publisher {
  publish(assembly: Assembly): Promise<void>;
  remind(assembly: Assembly): Promise<void>;
}
