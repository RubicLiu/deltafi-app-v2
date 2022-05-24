local base = import "../base.libsonnet";
local tag = import "./tag.txt";

base {
  imageTag: tag,
  dockerRegistry: '077918681028.dkr.ecr.us-west-2.amazonaws.com/deltafi-dev',
  domainName: 'app.k8s.deltafi-dev.trade',
}
