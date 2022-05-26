local base = import '../base.libsonnet';
local tag = importstr './tag.txt';

base {
  imageTag: tag,
  domainName: 'app-v2.k8s.deltafi.trade',
}
