{
  imageTag: error "imageTag is not set",
  dockerRegistry: error "dockerRegistry is not set",
  domainName: error "domainName is not set",

  local namespace = "default",
  local appFrontend = "deltafi-app-v2",
  local appBackend = "deltafi-app-v2-nodejs",

  apiVersion: 'v1',
  kind: 'List',
  items: [
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: appFrontend,
        namespace: namespace,
      },
      spec: {
        selector: {
          matchLabels: {
            app: appFrontend,
          },
        },
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: appFrontend,
            },
          },
          spec: {
            containers: [
              {
                image: std.format('%s/deltafi-app-v2/frontend:%s', [$.dockerRegistry, $.imageTag]),
                name: 'main',
                ports: [
                  {
                    containerPort: 80,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: appFrontend,
        namespace: namespace,
      },
      spec: {
        ports: [
          {
            port: 80,
            targetPort: 80,
            protocol: 'TCP',
          },
        ],
        selector: {
          app: appFrontend,
        },
      },
    },
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: appBackend,
        namespace: namespace,
      },
      spec: {
        selector: {
          matchLabels: {
            app: appBackend,
          },
        },
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: appBackend
            },
          },
          spec: {
            containers: [
              {
                image: std.format('%s/deltafi-app-v2/backend:%s', [$.dockerRegistry, $.imageTag]),
                name: 'main',
                ports: [
                  {
                    containerPort: 4000,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: appBackend,
        namespace: namespace,
      },
      spec: {
        ports: [
          {
            port: 4000,
            targetPort: 4000,
            protocol: 'TCP',
          },
        ],
        selector: {
          app: appBackend,
        },
      },
    },
    {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: 'deltafi-app-v2',
        namespace: namespace,
        annotations: {
          'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
          'nginx.ingress.kubernetes.io/rewrite-target': '/$1',
        },
      },
      spec: {
        ingressClassName: 'nginx',
        tls: [
          {
            hosts: [
              $.domainName,
            ],
            secretName: 'deltafi-app-v2-tls',
          },
        ],
        rules: [
          {
            host: $.domainName,
            http: {
              paths: [
                {
                  path: '/api/(.*)',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: appBackend,
                      port: {
                        number: 4000,
                      },
                    },
                  },
                },
                {
                  path: '/(.*)',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: appFrontend,
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
}