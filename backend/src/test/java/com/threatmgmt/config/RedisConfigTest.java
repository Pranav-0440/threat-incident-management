package com.threatmgmt.config;

import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RedisConfigTest {

    private final RedisConfig redisConfig = new RedisConfig();

    @Test
    void cacheManager_createsRedisCacheManagerWhenRedisIsAvailable() {
        RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);
        RedisConnection connection = mock(RedisConnection.class);
        when(connectionFactory.getConnection()).thenReturn(connection);
        when(connection.ping()).thenReturn("PONG");

        CacheManager cacheManager = redisConfig.cacheManager(connectionFactory);

        assertThat(cacheManager).isInstanceOf(RedisCacheManager.class);
    }

    @Test
    void cacheManager_fallsBackToInMemoryWhenRedisIsUnavailable() {
        RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);
        when(connectionFactory.getConnection()).thenThrow(new RuntimeException("Connection refused"));

        CacheManager cacheManager = redisConfig.cacheManager(connectionFactory);

        assertThat(cacheManager).isInstanceOf(ConcurrentMapCacheManager.class);
    }

    @Test
    void cacheManager_containsExpectedCachesWhenRedisIsAvailable() {
        RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);
        RedisConnection connection = mock(RedisConnection.class);
        when(connectionFactory.getConnection()).thenReturn(connection);
        when(connection.ping()).thenReturn("PONG");

        RedisCacheManager cacheManager = (RedisCacheManager) redisConfig.cacheManager(connectionFactory);

        // Access caches to trigger creation
        assertThat(cacheManager.getCache("userDetails")).isNotNull();
        assertThat(cacheManager.getCache("incidents")).isNotNull();
        assertThat(cacheManager.getCache("users")).isNotNull();
    }

    @Test
    void cacheManager_inMemoryFallbackContainsExpectedCaches() {
        RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);
        when(connectionFactory.getConnection()).thenReturn(null);

        ConcurrentMapCacheManager cacheManager =
                (ConcurrentMapCacheManager) redisConfig.cacheManager(connectionFactory);

        assertThat(cacheManager.getCache("userDetails")).isNotNull();
        assertThat(cacheManager.getCache("incidents")).isNotNull();
        assertThat(cacheManager.getCache("users")).isNotNull();
    }
}
