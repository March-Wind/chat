import { createConnection } from 'mongoose';
import { sanitizeSlashes } from '@marchyang/lib-core';
import { mongodb_uri, authSource } from '../../env';

import type { Connection } from 'mongoose';
class ManageConnections {
  allDbUriMap: Map<string, string> = new Map([
    ['users', sanitizeSlashes(`${mongodb_uri}/users`)],
    ['settings', sanitizeSlashes(`${mongodb_uri}/settings`)],
    ['transactions', sanitizeSlashes(`${mongodb_uri}/transactions`)],
  ]);
  connectionsMap: Map<string, Connection> = new Map();
  constructor() {
    this.allDbUriMap.forEach((uri, dbName) => {
      this.connectionsMap.set(dbName, createConnection(uri, { ...(authSource ? { authSource } : {}) }));
    });
  }
}
const manageConnections = new ManageConnections();
export default manageConnections;
