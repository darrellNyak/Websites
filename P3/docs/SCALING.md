# Scaling Screend to Millions of Users

## Current Architecture Limitations

At scale, the current MVP architecture will face challenges:

1. **Database Bottlenecks**: Single PostgreSQL instance
2. **Cache Limitations**: Single Redis instance
3. **API Server**: Single Express server
4. **Image Serving**: Direct TMDb URLs (no CDN)
5. **Search**: Basic PostgreSQL search
6. **Feed Generation**: Real-time queries

## Scaling Strategy

### Phase 1: 10K - 100K Users

#### Database Optimization

**Read Replicas**:
- Set up 2-3 PostgreSQL read replicas
- Route read queries to replicas
- Keep writes on primary

**Connection Pooling**:
- Use PgBouncer for connection pooling
- Reduce connection overhead
- Support more concurrent connections

**Indexing**:
- Add composite indexes for common queries
- Full-text search indexes
- Analyze query performance regularly

**Example**:
```sql
-- Composite index for feed queries
CREATE INDEX idx_feed_activity 
ON episode_logs(user_id, watched_at DESC);

-- Full-text search
CREATE INDEX idx_shows_search 
ON shows USING gin(to_tsvector('english', title || ' ' || description));
```

#### Caching Strategy

**Redis Clustering**:
- Set up Redis Cluster for high availability
- Distribute cache across nodes
- Automatic failover

**Cache Layers**:
- Application-level caching (in-memory)
- Redis for shared cache
- CDN for static assets

**Cache Keys**:
```
show:{id}:details - TTL: 1 hour
trending:shows:week - TTL: 6 hours
user:{id}:feed - TTL: 5 minutes
user:{id}:stats - TTL: 15 minutes
```

#### API Server Scaling

**Horizontal Scaling**:
- Deploy multiple API server instances
- Use load balancer (Nginx/HAProxy)
- Stateless design (no server-side sessions)

**Container Orchestration**:
- Docker containers
- Kubernetes for orchestration
- Auto-scaling based on CPU/memory

**Example Kubernetes Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: screend-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: screend-api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Phase 2: 100K - 1M Users

#### Database Sharding

**Shard by User ID**:
- Partition users across multiple databases
- Shard key: `user_id % num_shards`
- Cross-shard queries via API gateway

**Shard Strategy**:
```
Shard 1: user_id % 4 = 0
Shard 2: user_id % 4 = 1
Shard 3: user_id % 4 = 2
Shard 4: user_id % 4 = 3
```

**Challenges**:
- Cross-shard queries (feed, trending)
- Data consistency
- Migration complexity

#### Search Engine

**Elasticsearch Integration**:
- Index shows, episodes, reviews
- Fast full-text search
- Faceted search (genres, networks, etc.)
- Auto-complete suggestions

**Implementation**:
```javascript
// Index show
await elasticsearch.index({
  index: 'shows',
  id: show.id,
  body: {
    title: show.title,
    description: show.description,
    genres: show.genres,
    // ...
  }
});

// Search
const results = await elasticsearch.search({
  index: 'shows',
  body: {
    query: {
      multi_match: {
        query: searchQuery,
        fields: ['title^3', 'description']
      }
    }
  }
});
```

#### Message Queue

**Async Processing**:
- RabbitMQ or Apache Kafka
- Background jobs (notifications, stats updates)
- Event-driven architecture

**Use Cases**:
- Feed generation (async)
- Email notifications
- Statistics calculation
- Image processing

**Example**:
```javascript
// Publish event
await queue.publish('episode.logged', {
  userId: 1,
  episodeId: 123,
  timestamp: Date.now()
});

// Consumer
queue.subscribe('episode.logged', async (event) => {
  await updateUserStats(event.userId);
  await notifyFollowers(event.userId);
});
```

#### CDN for Images

**CloudFront/Cloudflare**:
- Cache TMDb images
- User-uploaded avatars
- Reduce origin load
- Global distribution

### Phase 3: 1M+ Users

#### Microservices Architecture

**Service Breakdown**:
- **Auth Service**: Authentication and authorization
- **Show Service**: Show data and metadata
- **Logging Service**: Episode logging and reviews
- **Social Service**: Follows, likes, comments
- **Feed Service**: Activity feed generation
- **Search Service**: Search and recommendations
- **Notification Service**: Push notifications, emails

**Communication**:
- REST APIs between services
- Message queue for async operations
- Service mesh (Istio) for routing

**Example Service**:
```javascript
// Feed Service
class FeedService {
  async generateFeed(userId: number) {
    // Get followed users
    const followed = await socialService.getFollowing(userId);
    
    // Get activities
    const activities = await Promise.all(
      followed.map(id => loggingService.getRecentActivity(id))
    );
    
    // Merge and sort
    return activities.flat().sort((a, b) => b.timestamp - a.timestamp);
  }
}
```

#### Data Warehouse

**Analytics Database**:
- Separate read-optimized database
- ETL pipeline from production DB
- Pre-aggregated statistics
- Business intelligence queries

**Tools**:
- PostgreSQL for analytics
- Or BigQuery/Redshift for large scale
- Apache Spark for processing

#### Caching at Scale

**Multi-Level Caching**:
1. **Application Cache**: In-memory (Node.js)
2. **Redis Cluster**: Distributed cache
3. **CDN**: Static assets and API responses
4. **Database Query Cache**: PostgreSQL query cache

**Cache Invalidation**:
- Event-driven invalidation
- TTL-based expiration
- Cache warming strategies

#### Database Optimization

**Partitioning**:
```sql
-- Partition episode_logs by date
CREATE TABLE episode_logs_2024_01 
PARTITION OF episode_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

**Materialized Views**:
```sql
-- Pre-calculated trending shows
CREATE MATERIALIZED VIEW trending_shows AS
SELECT 
  s.id,
  s.title,
  COUNT(el.id) as log_count,
  AVG(el.rating) as avg_rating
FROM shows s
JOIN seasons se ON s.id = se.show_id
JOIN episodes e ON se.id = e.season_id
JOIN episode_logs el ON e.id = el.episode_id
WHERE el.watched_at > NOW() - INTERVAL '7 days'
GROUP BY s.id, s.title
ORDER BY log_count DESC
LIMIT 100;

-- Refresh periodically
REFRESH MATERIALIZED VIEW trending_shows;
```

#### Feed Generation Optimization

**Pre-computed Feeds**:
- Generate feeds asynchronously
- Store in Redis or database
- Update incrementally
- Batch updates

**Algorithm**:
```javascript
// Generate feed for user
async function generateFeed(userId: number) {
  const followed = await getFollowing(userId);
  
  // Get recent activities (last 24 hours)
  const activities = await getRecentActivities(followed, 24);
  
  // Score and rank
  const scored = activities.map(scoreActivity);
  scored.sort((a, b) => b.score - a.score);
  
  // Store in cache
  await redis.setex(`feed:${userId}`, 300, JSON.stringify(scored));
  
  return scored.slice(0, 50);
}

function scoreActivity(activity) {
  let score = 0;
  
  // Recency boost
  const hoursAgo = (Date.now() - activity.timestamp) / (1000 * 60 * 60);
  score += 100 / (hoursAgo + 1);
  
  // Rating boost
  if (activity.rating) {
    score += activity.rating * 10;
  }
  
  // Review boost
  if (activity.review_text) {
    score += 20;
  }
  
  return { ...activity, score };
}
```

## Monitoring & Observability

### Metrics

**Key Metrics**:
- Request rate (RPS)
- Response time (p50, p95, p99)
- Error rate
- Database query time
- Cache hit rate
- Active users
- API endpoint usage

**Tools**:
- Prometheus for metrics
- Grafana for visualization
- DataDog/New Relic for APM

### Logging

**Structured Logging**:
```javascript
logger.info('episode.logged', {
  userId: 1,
  episodeId: 123,
  rating: 5,
  timestamp: Date.now()
});
```

**Centralized Logging**:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Or CloudWatch/DataDog
- Log aggregation and search

### Alerting

**Critical Alerts**:
- High error rate (> 1%)
- Slow response times (p95 > 1s)
- Database connection pool exhaustion
- Cache miss rate spike
- Disk space low

## Cost Optimization

### Infrastructure Costs

**Database**:
- Use managed services (AWS RDS, Google Cloud SQL)
- Right-size instances
- Use reserved instances for predictable workloads

**Caching**:
- Redis on smaller instances
- Use ElastiCache/Cloud Memorystore
- Monitor memory usage

**Compute**:
- Auto-scaling to match demand
- Spot instances for non-critical workloads
- Serverless for low-traffic endpoints

### Optimization Strategies

1. **Caching**: Reduce database load
2. **CDN**: Reduce origin server load
3. **Compression**: Gzip/Brotli for API responses
4. **Pagination**: Limit result sets
5. **Lazy Loading**: Load data on demand
6. **Database Indexing**: Optimize queries

## Security at Scale

### DDoS Protection

- Cloudflare or AWS Shield
- Rate limiting per IP
- CAPTCHA for suspicious traffic

### Authentication

- JWT with short expiration
- Refresh tokens
- Rate limiting on auth endpoints
- 2FA for sensitive operations

### Data Protection

- Encryption at rest
- Encryption in transit (TLS)
- PII data handling compliance
- Regular security audits

## Disaster Recovery

### Backup Strategy

- Daily database backups
- Point-in-time recovery
- Cross-region backups
- Test restore procedures

### High Availability

- Multi-region deployment
- Database replication
- Automatic failover
- Health checks and monitoring

## Performance Targets

### Response Times

- API endpoints: < 200ms (p95)
- Search: < 500ms (p95)
- Feed generation: < 1s (p95)
- Page load: < 2s

### Availability

- 99.9% uptime (8.76 hours downtime/year)
- 99.99% for critical services

### Throughput

- 10,000 requests/second
- 1M database queries/second
- 100K concurrent users

## Migration Plan

### Phase 1 (Current → 10K users)
1. Add read replicas
2. Implement Redis caching
3. Add CDN
4. Optimize database queries

### Phase 2 (10K → 100K users)
1. Set up load balancing
2. Implement Elasticsearch
3. Add message queue
4. Database sharding preparation

### Phase 3 (100K → 1M users)
1. Implement microservices
2. Database sharding
3. Advanced caching
4. Pre-computed feeds

### Phase 4 (1M+ users)
1. Full microservices architecture
2. Data warehouse
3. Advanced analytics
4. Global distribution

## Conclusion

Scaling Screend requires:
1. **Horizontal scaling** of all components
2. **Caching** at multiple levels
3. **Database optimization** and sharding
4. **Async processing** for heavy operations
5. **Monitoring** and observability
6. **Incremental migration** to avoid disruption

Start with simple optimizations and gradually move to more complex architectures as user base grows.
