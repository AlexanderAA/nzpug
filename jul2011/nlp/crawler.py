"""
Crawler demo.
"""
__author__ = "Alexander Abushkevich"
__version__ = "0.1a"

"""
amqp-publish -e ai -r zuzu -b hullo2
"""

import hashlib
import time
import random
from datetime import datetime

from amqplib import client_0_8 as amqp

# Settings
BROKER_HOST = "localhost:5672"
BROKER_USER = "guest"
BROKER_PASSWORD = "guest"

EXCHANGE = "exchtopic"
EXCHANGE_TYPE = "topic"
QUEUE = "proc"
ROUTING_KEY = "rproc"

LOG_EXCHANGE = "exchtopic"
LOG_EXCHANGE_TYPE = "topic"
LOG_QUEUE = "logq"
LOG_ROUTING_KEY = "rlog"
# End settings

UID = "".join([random.choice(list("abcdef0123456789")) for i in range(3)])

conn = amqp.Connection(host = BROKER_HOST, 
                       userid = BROKER_USER,
                       password = BROKER_PASSWORD)


def fetch_and_preprocess_page():
    """ Imitation of page download
    """
    time.sleep(random.randint(10, 15))
    
    return ("crawler|%s|%s|<h1>title</h1><p>article</p>" 
            % (UID, datetime.now().isoformat()))
    
def publish(msg_body):
    with conn.channel() as chan:
        chan.exchange_declare(exchange = EXCHANGE,
                              type = EXCHANGE_TYPE)
        
        chan.queue_declare(queue = QUEUE)
        
        print "crawler|%s::sending message: %s" % (UID, msg_body)
        msg = amqp.Message(msg_body)
        chan.basic_publish(msg,
                           exchange = EXCHANGE,
                           routing_key = ROUTING_KEY)
        
def log(msg_body):
    """
    Send message 
    """
    with conn.channel() as chan:
        chan.exchange_declare(exchange = LOG_EXCHANGE,
                              type = LOG_EXCHANGE_TYPE)
        
        chan.queue_declare(queue = LOG_QUEUE)
        chan.queue_bind(exchange=LOG_EXCHANGE, 
                        queue=LOG_QUEUE, 
                        routing_key=LOG_ROUTING_KEY)
        
        print "crawler|%s::logging message: %s" % (UID, msg_body)
        msg = amqp.Message("%s|log" % msg_body)
        
        chan.basic_publish(msg,
                           exchange = LOG_EXCHANGE,
                           routing_key = LOG_ROUTING_KEY)

def main():
    msg_body = fetch_and_preprocess_page()
    publish(msg_body)
    log(msg_body)

if __name__ == "__main__":
    
    while True:
        main()
