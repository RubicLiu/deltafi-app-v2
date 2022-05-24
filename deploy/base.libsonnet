{
  apiVersion: 'v1',
  kind: 'List',
  items: [
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'deltafi-app-v2',
        namespace: 'default',
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'deltafi-app-v2',
          },
        },
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: 'deltafi-app-v2',
            },
          },
          spec: {
            containers: [
              {
                image: '077918681028.dkr.ecr.us-west-2.amazonaws.com/deltafi-dev/deltafi-app-v2/frontend:a22a8ba-20220523-214000',
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
        name: 'deltafi-app-v2',
        namespace: 'default',
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
          app: 'deltafi-app-v2',
        },
      },
    },
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'deltafi-app-v2-nodejs',
        namespace: 'default',
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'deltafi-app-v2-nodejs',
          },
        },
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: 'deltafi-app-v2-nodejs',
            },
          },
          spec: {
            containers: [
              {
                image: '077918681028.dkr.ecr.us-west-2.amazonaws.com/deltafi-dev/deltafi-app-v2/backend:a22a8ba-20220523-214000',
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
        name: 'deltafi-app-v2-nodejs',
        namespace: 'default',
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
          app: 'deltafi-app-v2-nodejs',
        },
      },
    },
    {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: 'deltafi-app-v2',
        namespace: 'default',
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
              'app.k8s.deltafi-dev.trade',
            ],
            secretName: 'deltafi-app-v2-tls',
          },
        ],
        rules: [
          {
            host: 'app.k8s.deltafi-dev.trade',
            http: {
              paths: [
                {
                  path: '/api/(.*)',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: 'deltafi-app-v2-nodejs',
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
                      name: 'deltafi-app-v2',
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
