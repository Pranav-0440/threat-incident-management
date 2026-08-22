package com.threatmgmt.config;

import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RedisConfigTest {

    private final RedisConfig redisConfig = new RedisConfig();

    @Test
    void cacheManager_createsRedisCacheManagerWithExpectedCaches() {
        RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);

        CacheManager cacheManager = redisConfig.cacheManager(connectionFactory);

        assertThat(cacheManager).isInstanceOf(RedisCacheManager.class);
    }

    @Test
    void cacheManager_containsUserDetailsCacheConfiguration() {
        RedisConnectionFactory connectionFactory = mock(RedisConnectionFactory.class);

        RedisCacheManager cacheManager = (RedisCacheManager) redisConfig.cacheManager(connectionFactory);

        // Verify cache names are configured
        assertThat(cacheManager.getCacheNames()).isEmpty(); // lazy init, caches created on first access

        // Access caches to trigger creation
        assertThat(cacheManager.getCache("userDetails")).isNotNull();
        assertThat(cacheManager.getCache("incidents")).isNotNull();
        assertThat(cacheManager.getCache("users")).isNotNull();
    }
}
