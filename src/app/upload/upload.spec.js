if (FEAT.TCF_DEMO) {
describe('prx.upload', function () {

  beforeEach(module('angular-evaporate', function (evaporateProvider, $provide) {

    evaporateProvider.awsKey('AKIRAISAGREATMOVIE');

    $provide.decorator('$window', ['$delegate', function($delegate) {

      function mockEvaporate(options) {
        this.options = options;
        this.config = null;
      }

      mockEvaporate.prototype = {
        add: function (config) {
          this.config = config;
          return config.file['testId'];
        }
      };

      $delegate.Evaporate = mockEvaporate;

      return $delegate;
    }]);

  }));

  beforeEach(module('prx.upload'));

  describe ('Upload', function () {
    var uploadSvc;
    var evaporate;
    var $rs;

    beforeEach(inject(function (Upload, _evaporate_, _$rootScope_) {
      uploadSvc = Upload;
      $rs = _$rootScope_;
      evaporate = _evaporate_;
    }));

    it('adds a file to the Upload service', function () {
      var mockFile = {name: 'foo', testId: 123};
      var up = uploadSvc.upload(mockFile);
      expect(up.file).toEqual(mockFile);
      expect(up.uploadId).toEqual(123);
      expect(up.progress).toEqual(0);
    });

    it('updates the progress', function () {
      var msg = 0;

      var mockFile = {name: 'foo', testId: 123};
      var up = uploadSvc.upload(mockFile);
      up.then(function(){}, function(m){}, function(p){ msg = p; });
      var progressFn = evaporate._evaporate.config.progress;

      expect(up.progress).toEqual(0);
      $rs.$apply( function() { progressFn(0.5); } );
      expect(up.progress).toEqual(0.5);
      expect(msg).toEqual(0.5);
    });

    it('calls back on error', function () {
      var msg = '';
      var mockFile = {name: 'foo', testId: 123};
      uploadSvc.upload(mockFile).then(function(){}, function(m){ msg = m; }, function(p){});
      var errorFn = evaporate._evaporate.config.error;

      expect(msg).toEqual('');
      $rs.$apply( function() { errorFn('this is not good.'); } );
      expect(msg).toEqual('this is not good.');
    });

    it('calls back on complete', function () {
      var upload;
      var mockFile = {name: 'foo', testId: 123};
      uploadSvc.upload(mockFile).then(function(up){ upload = up;}, function(m){}, function(p){});
      var completeFn = evaporate._evaporate.config.complete;

      expect(upload).not.toBeDefined();
      $rs.$apply( function() { completeFn(); } );
      expect(upload).toBeDefined();
      expect(upload.upload).toBeDefined();
    });

  });

});
}