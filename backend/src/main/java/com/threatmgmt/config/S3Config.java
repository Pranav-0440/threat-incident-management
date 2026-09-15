package com.threatmgmt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${supabase.s3.endpoint:https://placeholder.supabase.co/storage/v1/s3}")
    private String endpoint;

    @Value("${supabase.s3.access-key:placeholder-access-key}")
    private String accessKey;

    @Value("${supabase.s3.secret-key:placeholder-secret-key}")
    private String secretKey;

    @Value("${supabase.s3.region:us-east-1}")
    private String region;

    @Bean
    public S3Client s3Client() {
        String resolvedEndpoint = (endpoint != null && !endpoint.isBlank()) 
                ? endpoint 
                : "https://placeholder.supabase.co/storage/v1/s3";
        String resolvedKey = (accessKey != null && !accessKey.isBlank()) ? accessKey : "placeholder-access-key";
        String resolvedSecret = (secretKey != null && !secretKey.isBlank()) ? secretKey : "placeholder-secret-key";
        String resolvedRegion = (region != null && !region.isBlank()) ? region : "us-east-1";

        return S3Client.builder()
                .endpointOverride(URI.create(resolvedEndpoint))
                .region(Region.of(resolvedRegion))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(resolvedKey, resolvedSecret)))
                // Supabase requires path-style access (not virtual-hosted-style)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        String resolvedEndpoint = (endpoint != null && !endpoint.isBlank()) 
                ? endpoint 
                : "https://placeholder.supabase.co/storage/v1/s3";
        String resolvedKey = (accessKey != null && !accessKey.isBlank()) ? accessKey : "placeholder-access-key";
        String resolvedSecret = (secretKey != null && !secretKey.isBlank()) ? secretKey : "placeholder-secret-key";
        String resolvedRegion = (region != null && !region.isBlank()) ? region : "us-east-1";

        return S3Presigner.builder()
                .endpointOverride(URI.create(resolvedEndpoint))
                .region(Region.of(resolvedRegion))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(resolvedKey, resolvedSecret)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }
}