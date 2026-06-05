# Praynr local Kubernetes with kind

This directory is a local-only Kubernetes learning setup. Docker Compose remains
the normal development and production path for this project.

For a quick glossary of pods, Deployments, Services, Ingress, PVCs, and rollouts,
see [KUBERNETES_QUICKSTART.md](KUBERNETES_QUICKSTART.md).

## What this setup includes

- A kind cluster named `praynr`.
- A namespace named `praynr-local`.
- Redis and MongoDB running inside Kubernetes.
- PersistentVolumeClaims for MongoDB data and API uploads.
- ConfigMap and Secret objects for API environment variables.
- API and worker Deployments using the same local image.
- An API Service plus optional nginx Ingress routing.
- Resource requests and limits for the app pods.

## 1. Create the cluster

Create the empty local cluster:

```powershell
kind create cluster --config k8s/local/kind-cluster.yaml
```

Check that `kubectl` is pointed at the kind cluster:

```powershell
kubectl config current-context
kubectl cluster-info --context kind-praynr
kubectl get nodes
```

`kind` manages the local cluster itself. `kubectl` manages resources inside the
cluster.

## 2. Apply resources one file at a time

This is the slow learning path:

```powershell
kubectl apply -f k8s/local/namespace.yaml
kubectl apply -f k8s/local/redis.yaml
kubectl apply -f k8s/local/mongo.yaml
kubectl apply -f k8s/local/api-config.yaml
```

Build the API image and load it into kind before applying the API and worker:

```powershell
docker build -t praynr-api:local services/api
kind load docker-image praynr-api:local --name praynr
kubectl apply -f k8s/local/api.yaml
kubectl apply -f k8s/local/worker.yaml
```

The API and worker use the same image, `praynr-api:local`, but run different
commands.

## 3. Apply everything with Kustomize

After the individual files make sense, apply the whole local stack with:

```powershell
kubectl apply -k k8s/local
```

`kustomization.yaml` is similar to a Makefile in that it saves repeated typing,
but it is declarative. It says which Kubernetes YAML files belong together.

It does not build or load Docker images. If API code changes, run:

```powershell
docker build -t praynr-api:local services/api
kind load docker-image praynr-api:local --name praynr
kubectl rollout restart deployment/api deployment/worker -n praynr-local
```

Then watch the rollout:

```powershell
kubectl rollout status deployment/api -n praynr-local
kubectl rollout status deployment/worker -n praynr-local
```

## 4. Inspect resources

See the main local objects:

```powershell
kubectl get all -n praynr-local
kubectl get pvc -n praynr-local
kubectl get ingress -n praynr-local
```

Read logs:

```powershell
kubectl logs deployment/api -n praynr-local
kubectl logs deployment/worker -n praynr-local
kubectl logs deployment/redis -n praynr-local
kubectl logs deployment/mongo -n praynr-local
```

Describe a healthy pod to learn what normal looks like:

```powershell
kubectl describe pod <pod-name> -n praynr-local
```

Look for scheduling events, container starts, mounted volumes, probes, resource
requests, and resource limits.

## 5. Watch self-healing

Delete the Redis pod and watch the Deployment recreate it:

```powershell
kubectl get pods -n praynr-local
kubectl delete pod <redis-pod-name> -n praynr-local
kubectl get pods -n praynr-local -w
```

Press `Ctrl+C` to stop watching.

This works because the Redis Deployment says the desired state is one Redis pod.
When the actual state drops to zero, Kubernetes creates a replacement.

## 6. Reach the API with port-forward

If port `8000` is free:

```powershell
kubectl port-forward service/api 8000:8000 -n praynr-local
```

Then visit:

```text
http://localhost:8000/health
```

If Docker Compose is already using `8000`, forward another local port:

```powershell
kubectl port-forward service/api 18000:8000 -n praynr-local
```

Then visit:

```text
http://localhost:18000/health
```

Port-forward is a normal debugging tool, not just a beginner shortcut.

## 7. Reach the API with Ingress

Install the nginx Ingress controller:

```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.15.1/deploy/static/provider/cloud/deploy.yaml
```

Wait for the controller:

```powershell
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
```

Apply the local Ingress rule:

```powershell
kubectl apply -f k8s/local/api-ingress.yaml
```

Or apply the whole local stack:

```powershell
kubectl apply -k k8s/local
```

Forward local port `8088` to the Ingress controller:

```powershell
kubectl port-forward --namespace ingress-nginx service/ingress-nginx-controller 8088:80
```

Then visit:

```text
http://localhost:8088/health
```

The Ingress path is:

```text
browser localhost:8088
  -> ingress-nginx controller
  -> api Ingress rule
  -> api Service
  -> API pod
```

In kind, a `LoadBalancer` service may show `EXTERNAL-IP` as `<pending>`. That
is normal unless you add extra local load balancer tooling.

## 8. Resource requests and limits

The Redis, Mongo, API, and worker containers declare CPU and memory requests and
limits.

- Requests tell Kubernetes what the pod expects for scheduling.
- Limits cap how much CPU or memory the container may use.

Inspect them with:

```powershell
kubectl describe pod <pod-name> -n praynr-local
```

Look under each container for `Requests` and `Limits`.

## 9. Rollouts

Deployments update pods through rollouts. Useful commands:

```powershell
kubectl rollout status deployment/api -n praynr-local
kubectl rollout history deployment/api -n praynr-local
kubectl rollout restart deployment/api -n praynr-local
kubectl rollout undo deployment/api -n praynr-local
```

Because the local API image tag stays `praynr-api:local`, Kubernetes will not
automatically notice code changes. Rebuild, load, then restart:

```powershell
docker build -t praynr-api:local services/api
kind load docker-image praynr-api:local --name praynr
kubectl rollout restart deployment/api deployment/worker -n praynr-local
```

MongoDB uses `strategy: Recreate` because it has one pod using one persistent
data directory. That prevents Kubernetes from briefly running old and new Mongo
pods against the same PVC during a rollout.

## 10. Secrets note

Kubernetes Secrets are not encrypted by default. They are base64-encoded unless
the cluster is configured for encryption at rest.

For this local setup, the secret values are intentionally empty placeholders.
Do not commit real Riot API keys or Discord webhook URLs.

## 11. Clean up

Delete the whole local cluster:

```powershell
kind delete cluster --name praynr
```

Deleting the kind cluster also removes the local Kubernetes storage used by
MongoDB and uploaded images.
