import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import getApolloClientConfig from './get-apollo-client-config';

import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

import {
  apolloClientBeforeCreate,
  apolloClientAfterCreate
} from 'src/apollo/apollo-client-hooks';

// function that returns an 'apollo client' instance
export default function ({ app, router, store, urlPath, redirect }) {
  const cfg = getApolloClientConfig({ app, router, store, urlPath, redirect });

  // create apollo client link
  const httpLink = new HttpLink(cfg.httpLinkConfig);

  // *create apollo ws
  const wsLink = new WebSocketLink(cfg.wsLinkConfig);

  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
    },
    // *ws
    wsLink,
    httpLink
  )

  // create apollo client cache
  const cache = new InMemoryCache(cfg.cacheConfig);

  // object that will be used to instantiate apollo client
  const apolloClientConfigObj = { link, cache, ...cfg.additionalConfig };

  // run hook before creating apollo client instance
  apolloClientBeforeCreate({
    apolloClientConfigObj,
    app,
    router,
    store,
    urlPath,
    redirect
  });

  // create an `apollo client` instance
  const apolloClient = new ApolloClient(apolloClientConfigObj);

  // run hook after creating apollo client instance
  apolloClientAfterCreate({
    apolloClient,
    app,
    router,
    store,
    urlPath,
    redirect
  });

  // return `apollo client` instance
  return apolloClient;
}
