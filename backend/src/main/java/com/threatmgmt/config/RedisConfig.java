package com.threatmgmt.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Duration;
import java.util.Collection;
import java.util.Map;

@Configuration
@EnableCaching
@Slf4j
public class RedisConfig implements CachingConfigurer {

    /**
     * Mixin that teaches Jackson how to deserialize Spring Security's User class,
     * which has no default constructor.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    static abstract class SpringSecurityUserMixin {
        @JsonCreator
        SpringSecurityUserMixin(
                @JsonProperty("username") String username,
                @JsonProperty("password") String password,
                @JsonProperty("authorities") Collection<? extends GrantedAuthority> authorities) {
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static abstract class SimpleGrantedAuthorityMixin {
        @JsonCreator
        SimpleGrantedAuthorityMixin(@JsonProperty("authority") String authority) {
        }
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        try {
            // Test Redis connectivity before committing to it
            connectionFactory.getConnection().ping();
            log.info("Redis connection successful — using Redis-backed CacheManager");
            return buildRedisCacheManager(connectionFactory);
        } catch (Exception e) {
            log.warn("Redis unavailable ({}), falling back to in-memory CacheManager", e.getMessage());
            return new ConcurrentMapCacheManager("userDetails", "incidents", "users");
        }
    }

    private RedisCacheManager buildRedisCacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.addMixIn(
                org.springframework.security.core.userdetails.User.class,
                SpringSecurityUserMixin.class);
        objectMapper.addMixIn(
                SimpleGrantedAuthority.class,
                SimpleGrantedAuthorityMixin.class);
        objectMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL);

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(15))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
                "userDetails", defaultConfig.entryTtl(Duration.ofMinutes(10)),
                "incidents", defaultConfig.entryTtl(Duration.ofMinutes(5)),
                "users", defaultConfig.entryTtl(Duration.ofMinutes(10))
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .transactionAware()
                .build();
    }

    /**
     * Graceful error handler — if Redis goes down at runtime, cache operations
     * are silently skipped instead of crashing authentication.
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception,
                    org.springframework.cache.Cache cache, Object key) {
                log.warn("Cache GET failed for key '{}' in cache '{}': {}",
                        key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception,
                    org.springframework.cache.Cache cache, Object key, Object value) {
                log.warn("Cache PUT failed for key '{}' in cache '{}': {}",
                        key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception,
                    org.springframework.cache.Cache cache, Object key) {
                log.warn("Cache EVICT failed for key '{}' in cache '{}': {}",
                        key, cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception,
                    org.springframework.cache.Cache cache) {
                log.warn("Cache CLEAR failed for cache '{}': {}",
                        cache.getName(), exception.getMessage());
            }
        };
    }
}
