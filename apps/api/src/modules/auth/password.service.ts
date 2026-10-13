import { Injectable } from "@nestjs/common";
import { hash, verify } from "@node-rs/argon2";

/** Argon2id hashing with the OWASP-recommended parameters. */
@Injectable()
export class PasswordService {
  private readonly options = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

  hash(password: string) {
    return hash(password, this.options);
  }

  async verify(passwordHash: string, password: string) {
    try {
      return await verify(passwordHash, password, this.options);
    } catch {
      return false;
    }
  }
}
