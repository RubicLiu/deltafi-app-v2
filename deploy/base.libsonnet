{
  imageTag:: error 'imageTag is not set',
  domainName:: error 'domainName is not set',
  frontendReplicas:: 2,
  backendReplicas:: 2,

  local dockerRegistry = "077918681028.dkr.ecr.us-west-2.amazonaws.com",
  local namespace = 'deltafi-app-v2',
  local appFrontend = 'deltafi-app-v2-frontend',
  local appBackend = 'deltafi-app-v2-backend',
  local env = [
    {
      name: "DOCKER_IMAGE_TAG",
      value: $.imageTag,
    },
  ],

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
        replicas: $.frontendReplicas,
        template: {
          metadata: {
            labels: {
              app: appFrontend,
            },
          },
          spec: {
            containers: [
              {
                image: std.format('%s/deltafi-app-v2/frontend:%s', [dockerRegistry, $.imageTag]),
                name: 'main',
                ports: [
                  {
                    containerPort: 80,
                  },
                ],
                env: env
              }
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
        replicas: $.backendReplicas,
        template: {
          metadata: {
            labels: {
              app: appBackend,
            },
          },
          spec: {
            containers: [
              {
                image: std.format('%s/deltafi-app-v2/backend:%s', [dockerRegistry, $.imageTag]),
                name: 'main',
                ports: [
                  {
                    containerPort: 4000,
                  },
                ],
                env: env
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
                  path: '/api/',
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
                  path: '/',
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
