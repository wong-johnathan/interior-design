# ─────────────────────────────────────────────────────────────────────
# nginx — Reverse Proxy
# ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Install inotify tools for optional config reload support
RUN apk add --no-cache inotify-tools

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL and logs
RUN mkdir -p /etc/nginx/ssl /var/log/nginx && \
    chmod 755 /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Health check — verify nginx is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Run as non-root user (nginx)
USER nginx

CMD ["nginx", "-g", "daemon off;"]
