# xray-checker built from source with a newer xray-core than upstream ships.
#
# xray-checker doesn't run an xray binary: it compiles xray-core in as a Go
# library, pinned in its go.mod (v1.3.1 pins a 2026-06-27 xray-core commit).
# To check servers with the same Xray the nodes run, this rebuilds it with
# XRAY_CORE_REF swapped in. Everything else matches upstream's Dockerfile.
#
# libXray (XTLS's share-link parser, also compiled in) is built against one
# xray-core API, so it moves in lockstep: XTLS tags a libXray release with the
# same name as each Xray-core release — always bump the two together.
#
# The refs are commits, not tag names: XTLS tags releases as vYY.M.D, which Go
# rejects for a v1 module path, so `go get` needs the tag's commit (it turns
# that into a pseudo-version). To upgrade to Xray <tag>:
#   gh api repos/XTLS/Xray-core/git/ref/tags/<tag> --jq .object.sha
#   gh api repos/XTLS/libXray/git/ref/tags/<tag>  --jq .object.sha
#     (libXray tags are annotated: dereference with
#      gh api repos/XTLS/libXray/git/tags/<that sha> --jq .object.sha)
# then bump the args below and `docker compose build xray-checker`.
ARG XRAY_CHECKER_VERSION=v1.3.1

# Go 1.27: xray-core from v26.11.x requires it (upstream v1.3.1 builds with 1.26).
FROM golang:1.27-alpine AS builder
ARG XRAY_CHECKER_VERSION
ARG XRAY_CORE_TAG=v26.11.9
ARG XRAY_CORE_REF=676eaf66f8f05d4d558ee7a74b4736623d3feeb9
ARG LIBXRAY_REF=5a0f7d8d1c28b34afb5727b04b26a10f6dbac7e3

RUN apk add --no-cache git
WORKDIR /src
RUN git clone --depth 1 --branch ${XRAY_CHECKER_VERSION} https://github.com/kutovoys/xray-checker.git .
RUN go get github.com/xtls/xray-core@${XRAY_CORE_REF} github.com/xtls/libxray@${LIBXRAY_REF}
# libXray v26.11 dropped the wrapper parser.go calls; see libxray_compat.go.
COPY libxray_compat.go subscription/libxray_compat.go
RUN sed -i \
      -e 's/libXray\.ConvertShareLinksToXrayJson(/convertShareLinksToXrayJSONCompat(/g' \
      -e '/libXray "github.com\/xtls\/libxray"/d' \
      subscription/parser.go && \
    ! grep -nE 'libXray\.[A-Z]' subscription/parser.go && \
    go mod tidy

# Upstream's own tests, against the new Xray: link parsing and xray config
# generation must behave exactly as before. The final image copies a marker
# from this stage, so a failing test fails the whole build.
#
# One upstream fixture needs updating: its "good" proxy is plain VLESS with no
# TLS to a public host, which Xray v26.x now refuses to build on purpose
# ("vless without TLS or other encryption is prohibited…"). It gets TLS here;
# the test still checks the same pruning logic. Our nodes are REALITY/TLS.
FROM builder AS test
RUN sed -i 's/Type: "tcp", Security: "none", Index: 0,/Type: "tcp", Security: "tls", SNI: "good.example.com", Index: 0,/' xray/config_test.go && \
    grep -q 'Security: "tls", SNI: "good.example.com", Index: 0,' xray/config_test.go && \
    go vet ./... && \
    go test ./... && \
    touch /tests-passed

FROM builder AS binary
RUN CGO_ENABLED=0 go build \
      -ldflags="-s -w -X main.version=${XRAY_CHECKER_VERSION}+xray-${XRAY_CORE_TAG}" \
      -o /usr/bin/xray-checker . && \
    go version -m /usr/bin/xray-checker | grep xray-core

FROM alpine:3.21
RUN apk add --no-cache ca-certificates curl tzdata && \
    adduser -D -u 1000 appuser && \
    mkdir -p /app/geo && \
    chown -R appuser:appuser /app
WORKDIR /app
COPY --from=test /tests-passed /tmp/.tests-passed
COPY --from=binary /usr/bin/xray-checker /usr/bin/xray-checker
USER appuser
ENTRYPOINT ["/usr/bin/xray-checker"]
