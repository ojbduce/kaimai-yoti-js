# Docker Image Registry

| Image Name |      Tag |           Local | Azure | Description | Date |
|------------|-----|-------|-------|-------------|------|
| kaimai-yoti-js | basic-scenario  | ✅ | ✅ | Initial working multi-arch build 2024-03-XX |
| kaimai-yoti-js | basic-scenario2 | ❌ | ✅ | Second working multi-arch build 2024-03-XX |
| kaimai-yoti-js | basic-iframe    | ❌ | ✅ | Optimized for iframe deployment 2024-03-XX |

## Build Command Reference
```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t kaimaiyoti.azurecr.io/kaimai-yoti-js:[TAG] \
  --push .
```

## Pull Command Reference
```bash
docker pull kaimaiyoti.azurecr.io/kaimai-
docker pull kaimaiyoti.azurecr.io/kaimai-yoti-js:basic2