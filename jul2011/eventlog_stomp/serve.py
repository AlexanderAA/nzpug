""" Simple WSGI HTTP app.
"""
__author__ = "Alexander Abushkevich"
__version__ = "0.1a"

from wsgiref.simple_server import make_server
from cgi import parse_qs, escape

ROUTES = {
    # Files
    '/': 'eventlog.html',
    
    # Actions
    #'/send': send,
}

def dispatch(environ, start_response):
    """ Simple dispatcher.
    
    Decides whether to call action or return some file. 
    Returns 404 if the file does not exist.
    
    """
    params = parse_qs(environ.get('QUERY_STRING', ''))
    path = environ.get('PATH_INFO', '')
    
    try:
        action_or_path = ROUTES[path]
    except KeyError:
        try:
            # Static file
            result = open(path[1:]).read()
        except:
            # 404
            start_response('404 NOT FOUND', [('Content-Type', 'text/html')])
            return [""]
        else:
            start_response('200 OK', [('Content-Type', 'text/html')])
            return [result]
    else:
        start_response('200 OK', [('Content-Type', 'text/html')])
        if isinstance(action_or_path, basestring):
            # Static file from ROUTES dictionary
            result = open(action_or_path).read()
        else:
            # Action
            result = ROUTES[path](**params)
        return [result]
    

if __name__ == '__main__':
    srv = make_server('localhost', 8000, dispatch)
    srv.serve_forever()
    