(function()
{
    'use strict';

    angular
        .module('xd-multiple-request-handler')
        .factory('multipleRequestHandler', multipleRequestHandler)
    ;

    /* @ngInject */
    function multipleRequestHandler($timeout)
    {
        var default_timeout_delay = 750;

        return {
            instance: function(request, timeout_delay)
            {
                var delay = typeof timeout_delay !== 'undefined' && timeout_delay !== undefined ? timeout_delay : default_timeout_delay;
                return new MultipleRequestHandler(request, delay);
            }
        };

        function MultipleRequestHandler(request, timeout_delay)
        {
            var __self = this;
            var current = {
                timeout: null,
                load_request: null
            };
            var values = {
                when_blackhole: null,
                after_blackhole: null
            };
            var after_blackhole_registered = false;
            __self.timeout_delay = timeout_delay;
            __self.request = request;

            __self.value_changed = value_changed;
            __self.watch = watch;

            function watch(scope, key)
            {
                scope.$watch(key, value_changed);
            }

            function value_changed(new_value, ex_value)
            {
                if(ex_value !== new_value)
                {
                    var canceled = !current.timeout || $timeout.cancel(current.timeout);

                    // We achieved to cancel it before request is done to server
                    if(canceled)
                    {
                        after_blackhole_registered = false;
                        current.timeout = $timeout(function()
                        {
                            current.load_request = __self.request();
                        }, timeout_delay);
                    }
                    else // the request is already pending --> wait for it to be completed before executing another one
                    {
                        if(values.when_blackhole === null)
                        {
                            values.when_blackhole = ex_value;
                        }
                        if(values.after_blackhole !== new_value)
                        {
                            values.after_blackhole = new_value;
                            if(!after_blackhole_registered)
                            {
                                after_blackhole_registered = true;
                                current.load_request.then(function()
                                {
                                    current.timeout = null;
                                    value_changed(values.after_blackhole, values.when_blackhole);
                                });
                            }
                        }
                    }
                }
            }
        }
    }
})();
