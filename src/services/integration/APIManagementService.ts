/**
 * Comprehensive API Management and Rate Limiting System
 * Provides enterprise-grade API management, monitoring, and control
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
export interface APIConfiguration {
  id: string;
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  authentication: AuthenticationConfig;
  rateLimiting: RateLimitConfig;
  caching: CachingConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  documentation: DocumentationConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  requestBody?: RequestBodySchema;
  responses: ResponseSchema[];
  rateLimitOverride?: RateLimitOverride;
  authenticationRequired: boolean;
  deprecated: boolean;
  tags: string[];
}

export interface APIParameter {
  name: string;
  location: 'query' | 'path' | 'header' | 'cookie';
  type: string;
  required: boolean;
  description: string;
  validation?: ValidationRule[];
  defaultValue?: any;
}

export interface RequestBodySchema {
  contentType: string;
  schema: JSONSchema;
  required: boolean;
  examples?: Record<string, any>;
}

export interface ResponseSchema {
  statusCode: number;
  description: string;
  contentType: string;
  schema: JSONSchema;
  headers?: Record<string, APIParameter>;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value?: any;
  message: string;
}

export interface AuthenticationConfig {
  type: 'none' | 'api_key' | 'jwt' | 'oauth2' | 'basic';
  config: Record<string, any>;
  required: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
  defaultLimits: RateLimits;
  strategy: 'sliding_window' | 'fixed_window' | 'token_bucket';
  storage: 'memory' | 'redis' | 'database';
}

export interface RateLimitOverride {
  requests: number;
  window: number; // in seconds
  perUser?: boolean;
  perApiKey?: boolean;
  perIP?: boolean;
}

export interface RateLimits {
  perSecond: number;
  perMinute: number;
  perHour: number;
  perDay: number;
}

export interface CachingConfig {
  enabled: boolean;
  defaultTTL: number; // in seconds
  strategy: 'memory' | 'redis' | 'database';
  cacheableStatusCodes: number[];
  invalidationRules: InvalidationRule[];
}

export interface InvalidationRule {
  pattern: string;
  trigger: 'manual' | 'time' | 'event';
  triggerConfig: Record<string, any>;
}

export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metrics: MetricsConfig;
  alerts: AlertConfig[];
  tracing: TracingConfig;
}

export interface MetricsConfig {
  collectRequestCount: boolean;
  collectResponseTime: boolean;
  collectErrorRate: boolean;
  collectPayloadSize: boolean;
  collectUserMetrics: boolean;
  retentionPeriod: number; // in days
}

export interface AlertConfig {
  name: string;
  type: 'error_rate' | 'response_time' | 'request_count' | 'security';
  threshold: number;
  window: number; // in minutes
  comparison: 'greater_than' | 'less_than' | 'equals';
  enabled: boolean;
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'webhook' | 'slack';
  config: Record<string, any>;
}

export interface TracingConfig {
  enabled: boolean;
  sampleRate: number; // 0-1
  includeHeaders: boolean;
  includePayload: boolean;
  maxPayloadSize: number; // in bytes
}

export interface SecurityConfig {
  cors: CORSConfig;
  rateLimitByIP: boolean;
  inputValidation: boolean;
  outputSanitization: boolean;
  sqlInjectionProtection: boolean;
  xssProtection: boolean;
  requestSizeLimit: number; // in bytes
  responseSizeLimit: number; // in bytes
  allowedOrigins: string[];
  blockedIPs: string[];
  allowedIPs: string[];
}

export interface CORSConfig {
  enabled: boolean;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

export interface DocumentationConfig {
  enabled: boolean;
  format: 'openapi' | 'swagger' | 'custom';
  autoGenerate: boolean;
  includeExamples: boolean;
  publicAccess: boolean;
  customSections?: Record<string, any>;
}

// Rate limiting data structures
export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: Date;
  windowEnd: Date;
  resetTime: Date;
}

export interface APIRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  user?: {
    id: string;
    apiKey?: string;
    ip: string;
    userAgent?: string;
  };
  timestamp: Date;
  apiConfig?: APIConfiguration;
  endpoint?: APIEndpoint;
}

export interface APIResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  duration: number; // in milliseconds
  size: number; // in bytes
  timestamp: Date;
}

export interface APIAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  topEndpoints: Array<{ path: string; method: string; count: number }>;
  errorRate: number;
  statusCodes: Record<number, number>;
  timeSeriesData: Array<{
    timestamp: Date;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }>;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  permissions: string[];
  rateLimits?: RateLimitOverride;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

/**
 * API Management Service - Enterprise-grade API management
 */
export class APIManagementService {
  private apiConfigs: Map<string, APIConfiguration> = new Map();
  private rateLimitStore: Map<string, RateLimitEntry[]> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private requestLogs: Array<{ request: APIRequest; response: APIResponse }> = [];
  private metrics: Map<string, any> = new Map();

  constructor() {
    this.loadConfigurations();
    this.startMetricsCollection();
    this.startCleanupProcess();
  }

  // API CONFIGURATION MANAGEMENT
  async createAPIConfiguration(config: {
    name: string;
    version: string;
    description: string;
    baseUrl: string;
    endpoints: Omit<APIEndpoint, 'id'>[];
    authentication: AuthenticationConfig;
    rateLimiting?: Partial<RateLimitConfig>;
    caching?: Partial<CachingConfig>;
    monitoring?: Partial<MonitoringConfig>;
    security?: Partial<SecurityConfig>;
    documentation?: Partial<DocumentationConfig>;
  }): Promise<APIConfiguration> {
    try {
      const id = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const apiConfig: APIConfiguration = {
        id,
        name: config.name,
        version: config.version,
        description: config.description,
        baseUrl: config.baseUrl,
        endpoints: config.endpoints.map((endpoint, index) => ({
          ...endpoint,
          id: `endpoint_${id}_${index}`
        })),
        authentication: config.authentication,
        rateLimiting: {
          enabled: true,
          defaultLimits: {
            perSecond: 10,
            perMinute: 100,
            perHour: 1000,
            perDay: 10000
          },
          strategy: 'sliding_window',
          storage: 'memory',
          ...config.rateLimiting
        },
        caching: {
          enabled: false,
          defaultTTL: 300,
          strategy: 'memory',
          cacheableStatusCodes: [200, 201, 202, 204, 301, 302],
          invalidationRules: [],
          ...config.caching
        },
        monitoring: {
          enabled: true,
          logLevel: 'info',
          metrics: {
            collectRequestCount: true,
            collectResponseTime: true,
            collectErrorRate: true,
            collectPayloadSize: true,
            collectUserMetrics: true,
            retentionPeriod: 30
          },
          alerts: [],
          tracing: {
            enabled: false,
            sampleRate: 0.1,
            includeHeaders: false,
            includePayload: false,
            maxPayloadSize: 1024
          },
          ...config.monitoring
        },
        security: {
          cors: {
            enabled: true,
            allowedOrigins: ['*'],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
            exposedHeaders: [],
            maxAge: 86400,
            credentials: false
          },
          rateLimitByIP: true,
          inputValidation: true,
          outputSanitization: true,
          sqlInjectionProtection: true,
          xssProtection: true,
          requestSizeLimit: 10485760, // 10MB
          responseSizeLimit: 10485760, // 10MB
          allowedOrigins: [],
          blockedIPs: [],
          allowedIPs: [],
          ...config.security
        },
        documentation: {
          enabled: true,
          format: 'openapi',
          autoGenerate: true,
          includeExamples: true,
          publicAccess: false,
          ...config.documentation
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.apiConfigs.set(id, apiConfig);
      await this.saveConfigurations();

      console.log(`✅ API Configuration created: ${apiConfig.name} v${apiConfig.version}`);
      return apiConfig;
    } catch (error) {
      console.error('❌ Error creating API configuration:', error);
      throw error;
    }
  }

  async updateAPIConfiguration(id: string, updates: Partial<APIConfiguration>): Promise<APIConfiguration> {
    try {
      const existingConfig = this.apiConfigs.get(id);
      if (!existingConfig) {
        throw new Error('API Configuration not found');
      }

      const updatedConfig = {
        ...existingConfig,
        ...updates,
        id,
        updatedAt: new Date()
      };

      this.apiConfigs.set(id, updatedConfig);
      await this.saveConfigurations();

      console.log(`✅ API Configuration updated: ${updatedConfig.name}`);
      return updatedConfig;
    } catch (error) {
      console.error('❌ Error updating API configuration:', error);
      throw error;
    }
  }

  async deleteAPIConfiguration(id: string): Promise<boolean> {
    try {
      const config = this.apiConfigs.get(id);
      if (!config) {
        throw new Error('API Configuration not found');
      }

      this.apiConfigs.delete(id);
      await this.saveConfigurations();

      console.log(`✅ API Configuration deleted: ${config.name}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting API configuration:', error);
      throw error;
    }
  }

  async getAPIConfiguration(id: string): Promise<APIConfiguration | null> {
    return this.apiConfigs.get(id) || null;
  }

  async getAPIConfigurations(filters?: {
    isActive?: boolean;
    search?: string;
  }): Promise<APIConfiguration[]> {
    let configs = Array.from(this.apiConfigs.values());

    if (filters?.isActive !== undefined) {
      configs = configs.filter(c => c.isActive === filters.isActive);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      configs = configs.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.baseUrl.toLowerCase().includes(searchLower)
      );
    }

    return configs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // RATE LIMITING
  async checkRateLimit(request: APIRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
  }> {
    try {
      const apiConfig = request.apiConfig;
      if (!apiConfig || !apiConfig.rateLimiting.enabled) {
        return {
          allowed: true,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER,
          resetTime: new Date(Date.now() + 3600000)
        };
      }

      // Determine rate limit key and limits
      const { key, limits } = this.determineRateLimitKey(request, apiConfig);

      // Check current usage
      const now = new Date();
      const windowEnd = new Date(now.getTime() + 60000); // 1-minute window
      const windowStart = new Date(windowEnd.getTime() - 60000);

      let entries = this.rateLimitStore.get(key) || [];

      // Remove expired entries
      entries = entries.filter(entry => entry.windowEnd > now);

      // Count requests in current window
      const currentCount = entries.length;

      // Check against limits
      const allowed = currentCount < limits.perMinute;

      // Create new entry
      const newEntry: RateLimitEntry = {
        key,
        count: 1,
        windowStart,
        windowEnd,
        resetTime: windowEnd
      };

      if (allowed) {
        entries.push(newEntry);
        this.rateLimitStore.set(key, entries);
      }

      return {
        allowed,
        limit: limits.perMinute,
        remaining: Math.max(0, limits.perMinute - currentCount),
        resetTime: windowEnd,
        retryAfter: allowed ? undefined : Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)
      };
    } catch (error) {
      console.error('❌ Error checking rate limit:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        limit: Number.MAX_SAFE_INTEGER,
        remaining: Number.MAX_SAFE_INTEGER,
        resetTime: new Date(Date.now() + 3600000)
      };
    }
  }

  private determineRateLimitKey(request: APIRequest, apiConfig: APIConfiguration): {
    key: string;
    limits: RateLimits;
  } {
    // Start with base key
    let key = `api:${apiConfig.id}`;
    let limits = apiConfig.rateLimiting.defaultLimits;

    // Check endpoint-specific overrides
    if (request.endpoint?.rateLimitOverride) {
      const override = request.endpoint.rateLimitOverride;
      limits = {
        perSecond: override.requests,
        perMinute: override.requests,
        perHour: override.requests,
        perDay: override.requests
      };
    }

    // Add user-specific components
    if (request.user?.apiKey && request.endpoint?.rateLimitOverride?.perApiKey) {
      key += `:apikey:${request.user.apiKey}`;
    } else if (request.user?.id && request.endpoint?.rateLimitOverride?.perUser) {
      key += `:user:${request.user.id}`;
    } else if (request.user?.ip && (apiConfig.security.rateLimitByIP || request.endpoint?.rateLimitOverride?.perIP)) {
      key += `:ip:${request.user.ip}`;
    }

    // Add endpoint-specific component
    key += `:${request.method}:${request.path}`;

    return { key, limits };
  }

  // REQUEST PROCESSING PIPELINE
  async processRequest(request: APIRequest): Promise<{
    allowed: boolean;
    statusCode: number;
    response?: any;
    headers?: Record<string, string>;
    blockedReason?: string;
  }> {
    try {
      // Find matching API configuration
      const apiConfig = await this.findMatchingAPIConfiguration(request);
      if (!apiConfig) {
        return {
          allowed: false,
          statusCode: 404,
          blockedReason: 'API configuration not found'
        };
      }

      if (!apiConfig.isActive) {
        return {
          allowed: false,
          statusCode: 503,
          blockedReason: 'API is currently inactive'
        };
      }

      request.apiConfig = apiConfig;

      // Find matching endpoint
      const endpoint = await this.findMatchingEndpoint(request, apiConfig);
      if (!endpoint) {
        return {
          allowed: false,
          statusCode: 404,
          blockedReason: 'Endpoint not found'
        };
      }

      if (endpoint.deprecated) {
        console.warn(`⚠️ Deprecated endpoint used: ${request.method} ${request.path}`);
      }

      request.endpoint = endpoint;

      // 1. Authentication check
      if (endpoint.authenticationRequired) {
        const authResult = await this.authenticateRequest(request, apiConfig);
        if (!authResult.valid) {
          return {
            allowed: false,
            statusCode: 401,
            blockedReason: authResult.reason || 'Authentication failed'
          };
        }
      }

      // 2. Rate limiting check
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          statusCode: 429,
          blockedReason: 'Rate limit exceeded',
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        };
      }

      // 3. Input validation
      if (apiConfig.security.inputValidation) {
        const validationResult = await this.validateInput(request, endpoint);
        if (!validationResult.valid) {
          return {
            allowed: false,
            statusCode: 400,
            blockedReason: validationResult.reason || 'Invalid input',
            response: { errors: validationResult.errors }
          };
        }
      }

      // 4. CORS check (for browser requests)
      if (apiConfig.security.cors.enabled && request.headers['origin']) {
        const corsResult = await this.checkCORS(request, apiConfig);
        if (!corsResult.allowed) {
          return {
            allowed: false,
            statusCode: 403,
            blockedReason: 'CORS policy violation',
            headers: corsResult.headers
          };
        }
      }

      // 5. IP blocking check
      if (request.user?.ip) {
        if (apiConfig.security.blockedIPs.includes(request.user.ip)) {
          return {
            allowed: false,
            statusCode: 403,
            blockedReason: 'IP address blocked'
          };
        }

        if (apiConfig.security.allowedIPs.length > 0 &&
            !apiConfig.security.allowedIPs.includes(request.user.ip)) {
          return {
            allowed: false,
            statusCode: 403,
            blockedReason: 'IP address not allowed'
          };
        }
      }

      // Request allowed to proceed
      return {
        allowed: true,
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ Error processing request:', error);
      return {
        allowed: false,
        statusCode: 500,
        blockedReason: 'Internal server error'
      };
    }
  }

  private async findMatchingAPIConfiguration(request: APIRequest): Promise<APIConfiguration | null> {
    const configs = Array.from(this.apiConfigs.values());

    // Find config where the request path matches the base URL
    for (const config of configs) {
      if (request.path.startsWith(config.baseUrl.replace(/https?:\/\/[^\/]+/, ''))) {
        return config;
      }
    }

    return null;
  }

  private async findMatchingEndpoint(request: APIRequest, apiConfig: APIConfiguration): Promise<APIEndpoint | null> {
    const requestPath = request.path.replace(apiConfig.baseUrl.replace(/https?:\/\/[^\/]+/, ''), '');

    return apiConfig.endpoints.find(endpoint => {
      // Simple path matching - can be enhanced with regex patterns
      const endpointPath = endpoint.path.replace(/{[^}]+}/g, '[^/]+');
      const pattern = new RegExp(`^${endpointPath}$`);
      return endpoint.method === request.method && pattern.test(requestPath);
    }) || null;
  }

  private async authenticateRequest(request: APIRequest, apiConfig: APIConfiguration): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    try {
      const auth = apiConfig.authentication;

      switch (auth.type) {
        case 'none':
          return { valid: true };

        case 'api_key':
          const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');
          if (!apiKey) {
            return { valid: false, reason: 'API key required' };
          }

          const keyData = this.apiKeys.get(apiKey);
          if (!keyData || !keyData.isActive) {
            return { valid: false, reason: 'Invalid or inactive API key' };
          }

          if (keyData.expiresAt && keyData.expiresAt < new Date()) {
            return { valid: false, reason: 'API key expired' };
          }

          // Update last used
          keyData.lastUsedAt = new Date();
          keyData.usageCount++;

          request.user = {
            ...request.user,
            id: keyData.userId,
            apiKey: apiKey
          };

          return { valid: true };

        case 'jwt':
          const token = request.headers['authorization']?.replace('Bearer ', '');
          if (!token) {
            return { valid: false, reason: 'JWT token required' };
          }

          // JWT validation would go here
          // For now, just check if token exists
          return { valid: true };

        case 'basic':
          const authHeader = request.headers['authorization'];
          if (!authHeader || !authHeader.startsWith('Basic ')) {
            return { valid: false, reason: 'Basic authentication required' };
          }

          // Basic auth validation would go here
          return { valid: true };

        default:
          return { valid: false, reason: 'Unsupported authentication type' };
      }
    } catch (error) {
      console.error('❌ Error authenticating request:', error);
      return { valid: false, reason: 'Authentication error' };
    }
  }

  private async validateInput(request: APIRequest, endpoint: APIEndpoint): Promise<{
    valid: boolean;
    reason?: string;
    errors?: string[];
  }> {
    try {
      const errors: string[] = [];

      // Validate path parameters
      for (const param of endpoint.parameters.filter(p => p.location === 'path')) {
        const value = this.extractPathParameter(request.path, param.name);
        if (param.required && !value) {
          errors.push(`Path parameter '${param.name}' is required`);
        } else if (value && !this.validateParameter(value, param)) {
          errors.push(`Invalid value for path parameter '${param.name}'`);
        }
      }

      // Validate query parameters
      for (const param of endpoint.parameters.filter(p => p.location === 'query')) {
        const value = request.query[param.name];
        if (param.required && !value) {
          errors.push(`Query parameter '${param.name}' is required`);
        } else if (value && !this.validateParameter(value, param)) {
          errors.push(`Invalid value for query parameter '${param.name}'`);
        }
      }

      // Validate headers
      for (const param of endpoint.parameters.filter(p => p.location === 'header')) {
        const value = request.headers[param.name.toLowerCase()];
        if (param.required && !value) {
          errors.push(`Header '${param.name}' is required`);
        } else if (value && !this.validateParameter(value, param)) {
          errors.push(`Invalid value for header '${param.name}'`);
        }
      }

      // Validate request body if present
      if (endpoint.requestBody && request.body) {
        const bodyValidation = this.validateRequestBody(request.body, endpoint.requestBody);
        if (!bodyValidation.valid) {
          errors.push(...(bodyValidation.errors || []));
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ Error validating input:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  private extractPathParameter(path: string, paramName: string): string | null {
    // Simple path parameter extraction - can be enhanced
    const match = path.match(new RegExp(`/${paramName}/([^/]+)`));
    return match ? match[1] : null;
  }

  private validateParameter(value: any, param: APIParameter): boolean {
    try {
      // Type validation
      if (param.type === 'number' && isNaN(Number(value))) {
        return false;
      }

      if (param.type === 'boolean' && typeof value !== 'boolean') {
        return false;
      }

      if (param.type === 'array' && !Array.isArray(value)) {
        return false;
      }

      // Custom validation rules
      if (param.validation) {
        for (const rule of param.validation) {
          if (!this.applyValidationRule(value, rule)) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private applyValidationRule(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';

      case 'min':
        return Number(value) >= Number(rule.value);

      case 'max':
        return Number(value) <= Number(rule.value);

      case 'pattern':
        return new RegExp(rule.value).test(String(value));

      case 'enum':
        return Array.isArray(rule.value) && rule.value.includes(value);

      default:
        return true;
    }
  }

  private validateRequestBody(body: any, schema: RequestBodySchema): {
    valid: boolean;
    errors?: string[];
  } {
    try {
      const errors: string[] = [];

      if (schema.required && (!body || typeof body !== 'object')) {
        errors.push('Request body is required');
        return { valid: false, errors };
      }

      if (body && schema.schema) {
        const validationErrors = this.validateJSONSchema(body, schema.schema);
        errors.push(...validationErrors);
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return { valid: false, errors: ['Request body validation failed'] };
    }
  }

  private validateJSONSchema(obj: any, schema: JSONSchema): string[] {
    const errors: string[] = [];

    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (schema.required?.includes(key) && !(key in obj)) {
          errors.push(`Missing required property: ${key}`);
        } else if (key in obj) {
          errors.push(...this.validateJSONSchema(obj[key], propSchema));
        }
      }
    }

    if (schema.type === 'array' && schema.items) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          errors.push(...this.validateJSONSchema(item, schema.items!).map(e => `[${index}] ${e}`));
        });
      }
    }

    // Additional validations can be added here

    return errors;
  }

  private async checkCORS(request: APIRequest, apiConfig: APIConfiguration): Promise<{
    allowed: boolean;
    headers?: Record<string, string>;
  }> {
    try {
      const cors = apiConfig.security.cors;
      const origin = request.headers['origin'];

      if (!origin) {
        return { allowed: true }; // Not a cross-origin request
      }

      const allowedOrigins = cors.allowedOrigins.includes('*') || cors.allowedOrigins.includes(origin);
      if (!allowedOrigins) {
        return { allowed: false };
      }

      // Add CORS headers for preflight requests
      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': cors.allowedMethods.join(', '),
        'Access-Control-Allow-Headers': cors.allowedHeaders.join(', '),
        'Access-Control-Max-Age': cors.maxAge.toString()
      };

      if (cors.exposedHeaders.length > 0) {
        headers['Access-Control-Expose-Headers'] = cors.exposedHeaders.join(', ');
      }

      if (cors.credentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
      }

      return { allowed: true, headers };
    } catch (error) {
      console.error('❌ Error checking CORS:', error);
      return { allowed: false };
    }
  }

  // API KEY MANAGEMENT
  async createAPIKey(config: {
    name: string;
    userId: string;
    permissions: string[];
    rateLimits?: RateLimitOverride;
    expiresAt?: Date;
  }): Promise<APIKey> {
    try {
      const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const key = this.generateAPIKey();

      const apiKey: APIKey = {
        id,
        name: config.name,
        key,
        userId: config.userId,
        permissions: config.permissions,
        rateLimits: config.rateLimits,
        isActive: true,
        expiresAt: config.expiresAt,
        createdAt: new Date(),
        usageCount: 0
      };

      this.apiKeys.set(key, apiKey);
      await this.saveAPIKeys();

      console.log(`✅ API Key created: ${apiKey.name}`);
      return apiKey;
    } catch (error) {
      console.error('❌ Error creating API key:', error);
      throw error;
    }
  }

  async revokeAPIKey(key: string): Promise<boolean> {
    try {
      const apiKey = this.apiKeys.get(key);
      if (!apiKey) {
        throw new Error('API key not found');
      }

      apiKey.isActive = false;
      await this.saveAPIKeys();

      console.log(`✅ API Key revoked: ${apiKey.name}`);
      return true;
    } catch (error) {
      console.error('❌ Error revoking API key:', error);
      throw error;
    }
  }

  private generateAPIKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ANALYTICS AND MONITORING
  async getAPIAnalytics(apiId?: string, timeRange?: {
    startDate: Date;
    endDate: Date;
  }): Promise<APIAnalytics> {
    try {
      let filteredLogs = this.requestLogs;

      if (apiId) {
        filteredLogs = filteredLogs.filter(log =>
          log.request.apiConfig?.id === apiId
        );
      }

      if (timeRange) {
        filteredLogs = filteredLogs.filter(log =>
          log.request.timestamp >= timeRange.startDate &&
          log.request.timestamp <= timeRange.endDate
        );
      }

      const totalRequests = filteredLogs.length;
      const successfulRequests = filteredLogs.filter(log => log.response.statusCode < 400).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = totalRequests > 0
        ? filteredLogs.reduce((sum, log) => sum + log.response.duration, 0) / totalRequests
        : 0;

      // Count requests per endpoint
      const endpointCounts = new Map<string, number>();
      filteredLogs.forEach(log => {
        const key = `${log.request.method} ${log.request.path}`;
        endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
      });

      const topEndpoints = Array.from(endpointCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([pathMethod, count]) => {
          const [method, ...pathParts] = pathMethod.split(' ');
          return {
            method,
            path: pathParts.join(' '),
            count
          };
        });

      // Count status codes
      const statusCodes: Record<number, number> = {};
      filteredLogs.forEach(log => {
        statusCodes[log.response.statusCode] = (statusCodes[log.response.statusCode] || 0) + 1;
      });

      // Generate time series data
      const timeSeriesData = this.generateTimeSeriesData(filteredLogs);

      // Calculate requests per second
      const timeSpan = (timeRange?.endDate.getTime() - timeRange?.startDate.getTime()) || 3600000; // 1 hour default
      const requestsPerSecond = totalRequests / (timeSpan / 1000);

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        requestsPerSecond,
        topEndpoints,
        errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
        statusCodes,
        timeSeriesData
      };
    } catch (error) {
      console.error('❌ Error getting API analytics:', error);
      throw error;
    }
  }

  private generateTimeSeriesData(logs: Array<{ request: APIRequest; response: APIResponse }>): Array<{
    timestamp: Date;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }> {
    // Group logs by hour
    const hourlyData = new Map<number, {
      requests: number;
      errors: number;
      totalTime: number;
    }>();

    logs.forEach(log => {
      const hour = Math.floor(log.request.timestamp.getTime() / (1000 * 60 * 60));
      const existing = hourlyData.get(hour) || { requests: 0, errors: 0, totalTime: 0 };

      hourlyData.set(hour, {
        requests: existing.requests + 1,
        errors: existing.errors + (log.response.statusCode >= 400 ? 1 : 0),
        totalTime: existing.totalTime + log.response.duration
      });
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      timestamp: new Date(hour * 1000 * 60 * 60),
      requests: data.requests,
      errors: data.errors,
      avgResponseTime: data.requests > 0 ? data.totalTime / data.requests : 0
    }));
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeAPIs: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeAPIKeys: number;
    recentErrors: string[];
  }> {
    try {
      const apis = Array.from(this.apiConfigs.values());
      const activeAPIs = apis.filter(api => api.isActive).length;
      const totalRequests = this.requestLogs.length;

      const recentLogs = this.requestLogs.slice(-1000); // Last 1000 requests
      const recentErrors = recentLogs.filter(log => log.response.statusCode >= 400);
      const errorRate = totalRequests > 0 ? (recentErrors.length / recentLogs.length) * 100 : 0;

      const averageResponseTime = recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + log.response.duration, 0) / recentLogs.length
        : 0;

      const activeAPIKeys = Array.from(this.apiKeys.values()).filter(key => key.isActive).length;

      const recentErrorMessages = recentErrors.slice(0, 10).map(log =>
        `${log.request.method} ${log.request.path} - ${log.response.statusCode}`
      );

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (errorRate > 10 || averageResponseTime > 5000) {
        status = 'degraded';
      }

      if (errorRate > 25 || averageResponseTime > 10000) {
        status = 'unhealthy';
      }

      return {
        status,
        activeAPIs,
        totalRequests,
        errorRate,
        averageResponseTime,
        activeAPIKeys,
        recentErrors: recentErrorMessages
      };
    } catch (error) {
      console.error('❌ Error getting health status:', error);
      return {
        status: 'unhealthy',
        activeAPIs: 0,
        totalRequests: 0,
        errorRate: 100,
        averageResponseTime: 0,
        activeAPIKeys: 0,
        recentErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // UTILITY METHODS
  private startMetricsCollection(): void {
    // Collect metrics every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60000);
  }

  private collectMetrics(): void {
    try {
      // Store basic metrics
      this.metrics.set('total_requests', this.requestLogs.length);
      this.metrics.set('active_apis', Array.from(this.apiConfigs.values()).filter(api => api.isActive).length);
      this.metrics.set('active_keys', Array.from(this.apiKeys.values()).filter(key => key.isActive).length);

      // Calculate recent metrics
      const recentLogs = this.requestLogs.slice(-100);
      if (recentLogs.length > 0) {
        const avgResponseTime = recentLogs.reduce((sum, log) => sum + log.response.duration, 0) / recentLogs.length;
        const errorRate = (recentLogs.filter(log => log.response.statusCode >= 400).length / recentLogs.length) * 100;

        this.metrics.set('avg_response_time', avgResponseTime);
        this.metrics.set('error_rate', errorRate);
      }

      console.log('📊 Metrics collected:', Object.fromEntries(this.metrics));
    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
    }
  }

  private startCleanupProcess(): void {
    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000);
  }

  private cleanupOldData(): void {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      // Clean old rate limit entries
      for (const [key, entries] of this.rateLimitStore.entries()) {
        const validEntries = entries.filter(entry => entry.windowEnd > now);
        if (validEntries.length === 0) {
          this.rateLimitStore.delete(key);
        } else {
          this.rateLimitStore.set(key, validEntries);
        }
      }

      // Clean old request logs (keep last 10000)
      if (this.requestLogs.length > 10000) {
        this.requestLogs = this.requestLogs.slice(-10000);
      }

      console.log('🧹 Old data cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
    }
  }

  // PERSISTENCE
  private async loadConfigurations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('api_configurations');
      if (data) {
        const configs = JSON.parse(data);
        configs.forEach((config: APIConfiguration) => {
          this.apiConfigs.set(config.id, config);
        });
      }

      const keysData = await AsyncStorage.getItem('api_keys');
      if (keysData) {
        const keys = JSON.parse(keysData);
        keys.forEach((key: APIKey) => {
          this.apiKeys.set(key.key, key);
        });
      }
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
    }
  }

  private async saveConfigurations(): Promise<void> {
    try {
      const configs = Array.from(this.apiConfigs.values());
      await AsyncStorage.setItem('api_configurations', JSON.stringify(configs));
    } catch (error) {
      console.error('❌ Error saving configurations:', error);
    }
  }

  private async saveAPIKeys(): Promise<void> {
    try {
      const keys = Array.from(this.apiKeys.values());
      await AsyncStorage.setItem('api_keys', JSON.stringify(keys));
    } catch (error) {
      console.error('❌ Error saving API keys:', error);
    }
  }
}

// Export singleton instance
export const apiManagementService = new APIManagementService();