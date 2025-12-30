import { TestBed } from '@angular/core/testing';
import { SessionUtilsService } from './session-utils.service';

describe('SessionUtilsService', () => {
  let service: SessionUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionUtilsService]
    });
    service = TestBed.inject(SessionUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('extractSessionId', () => {
    it('should extract ID from full session path', () => {
      const result = service.extractSessionId('projects/123/sessions/456');
      expect(result).toBe('456');
    });

    it('should return the same value for plain ID', () => {
      const result = service.extractSessionId('test-session-id');
      expect(result).toBe('test-session-id');
    });

    it('should handle session name with multiple slashes', () => {
      const result = service.extractSessionId('a/b/c/d/session-id');
      expect(result).toBe('session-id');
    });

    it('should handle empty string', () => {
      const result = service.extractSessionId('');
      expect(result).toBe('');
    });

    it('should handle single slash', () => {
      const result = service.extractSessionId('prefix/session-id');
      expect(result).toBe('session-id');
    });
  });
});
