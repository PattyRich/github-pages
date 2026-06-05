# Kubernetes quickstart mental model

This is a small glossary for the local Praynr kind setup.

## The big picture

Kubernetes is a desired-state system. You give it YAML that says what should
exist, and controllers keep trying to make the real cluster match that desired
state.

```text
YAML manifests
  -> Kubernetes API
  -> controllers compare desired state to actual state
  -> pods are created, replaced, restarted, or routed to
```

## Cluster

The cluster is the whole Kubernetes environment.

In this repo, kind creates a local cluster named `praynr`:

```powershell
kind create cluster --config k8s/local/kind-cluster.yaml
```

`kind` manages the local cluster. `kubectl` manages things inside the cluster.

## Context

A context tells `kubectl` which cluster to talk to.

Check it before mutating commands:

```powershell
kubectl config current-context
```

For this local setup, it should be:

```text
kind-praynr
```

## Namespace

A namespace is a named room inside the cluster.

Praynr local resources live in:

```text
praynr-local
```

Most commands should include:

```powershell
-n praynr-local
```

The namespace chooses the room. The context chooses the cluster.

## Pod

A pod is the smallest runnable unit in Kubernetes.

For this project, each pod usually contains one container:

```text
api pod    -> praynr-api:local container
worker pod -> praynr-api:local container with a different command
redis pod  -> redis:7 container
mongo pod  -> mongo:7.0 container
```

Pods are disposable. If a pod dies, Kubernetes usually creates a replacement
with a different name and IP.

## Deployment

A Deployment manages a set of identical pods.

It says:

```text
Keep N copies of this pod template running.
```

Examples in this setup:

```text
deployment/api
deployment/worker
deployment/redis
deployment/mongo
```

If you delete the Redis pod, the Redis Deployment creates a replacement because
the desired state is still one Redis pod.

## ReplicaSet

A ReplicaSet is the lower-level object created by a Deployment.

During a rollout, a Deployment creates a new ReplicaSet for the new pod template
and scales down the old ReplicaSet.

You usually interact with Deployments, not ReplicaSets.

## Service

A Service gives pods a stable network name.

Pods get replaced and their IPs change. Services stay stable.

Examples:

```text
redis:6379 -> current Redis pod
mongo:27017 -> current Mongo pod
api:8000 -> current API pod
```

The API can connect to Mongo using:

```text
mongodb://mongo:27017/
```

because `mongo` is the Kubernetes Service name.

## Ingress

Ingress is HTTP routing into the cluster.

An Ingress object is only a rule. An Ingress controller, such as ingress-nginx,
actually receives traffic and applies the rule.

For this setup:

```text
browser localhost:8088
  -> port-forward to ingress-nginx controller
  -> api Ingress rule
  -> api Service
  -> API pod
```

This is similar in spirit to nginx `sites-enabled` routing, but controlled by
Kubernetes objects.

## ConfigMap

A ConfigMap stores non-secret configuration.

In this setup, `api-config` stores values like:

```text
MONGO_URI=mongodb://mongo:27017/
REDIS_HOST=redis
REDIS_PORT=6379
```

## Secret

A Secret stores secret-shaped configuration, like API keys or webhook URLs.

Important: Kubernetes Secrets are not encrypted by default. They are
base64-encoded unless the cluster is configured for encryption at rest.

For this local setup, secret values are empty placeholders.

## PersistentVolumeClaim

A PersistentVolumeClaim asks Kubernetes for storage.

This setup uses PVCs for:

```text
mongo-data  -> MongoDB files at /data/db
api-uploads -> uploaded images at /app/static/uploads
```

Pods are disposable. PVCs let important files survive pod replacement.

In kind, the data lives inside Docker Desktop's internal storage through the
kind node container. Deleting the kind cluster removes that local storage.

## Image

An image is the packaged app.

For the API:

```powershell
docker build -t praynr-api:local services/api
kind load docker-image praynr-api:local --name praynr
```

The API and worker use the same image. The worker overrides the command to run:

```text
rq worker --url redis://redis:6379/0 default
```

## Rollout

A rollout happens when a Deployment's pod template changes.

Useful commands:

```powershell
kubectl rollout status deployment/api -n praynr-local
kubectl rollout history deployment/api -n praynr-local
kubectl rollout restart deployment/api -n praynr-local
kubectl rollout undo deployment/api -n praynr-local
```

`rollout undo` rolls back one Deployment's pod template. It does not undo every
object changed by a previous `kubectl apply`.

## Requests and limits

Resource requests tell Kubernetes what a pod expects.

Resource limits cap what a container may use.

Inspect them with:

```powershell
kubectl describe pod <pod-name> -n praynr-local
```

## A simple request path

With port-forward directly to the API:

```text
browser localhost:8000
  -> kubectl port-forward service/api
  -> api Service
  -> API pod
```

With Ingress:

```text
browser localhost:8088
  -> port-forward to ingress-nginx controller
  -> Ingress rule
  -> api Service
  -> API pod
```

## Safety habit

Before mutating commands, check:

```powershell
kubectl config current-context
```

Use explicit namespaces:

```powershell
kubectl get pods -n praynr-local
```

For extra safety on local commands:

```powershell
kubectl apply -k k8s/local --context kind-praynr
```
