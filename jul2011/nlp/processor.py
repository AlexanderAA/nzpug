""" Processor demo.
"""
__author__ = "Alexander Abushkevich"
__version__ = "0.1a"

import hashlib
import time
import random
from amqplib import client_0_8 as amqp

# --- Settings ---
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
# --- End settings ---

# Get some "unique" id for current instance
UID =  "".join([random.choice(list("abcdef0123456789")) for i in range(3)])

def consume():
    """ Listens for messages from RabbitMQ and consumes them.
    """
    with conn.channel() as chan:
        
        def on_msg_recv(msg):
            """ Called when message arrives from RabbitMQ
            """
            print "processor|%s::Received message: %s" % (UID, msg.body)
            chan.basic_ack(msg.delivery_tag)
            log(msg.body)
            process_msg(msg)
            
        
        # Declare and bind queue. RabbitMQ does nothing if queue already exists.
        chan.exchange_declare(exchange = EXCHANGE,
                              type = EXCHANGE_TYPE)
        queue = chan.queue_declare(QUEUE)
        chan.queue_bind(exchange = EXCHANGE, 
                        queue = QUEUE, 
                        routing_key = ROUTING_KEY)
        
        # Declare that we are going to listen to given queue
        chan.basic_consume(queue = QUEUE, 
                           callback = on_msg_recv)
        
        # Main loop. Waiting for messages from RabbitMQ.
        while True:
            chan.wait()

def process_msg(msg):
    """ Imitation of message processing
    """
    time.sleep(random.randint(2, 10))
    print "processor|%s::Processed message: %s" % (UID, msg.body)
    
def log(msg_body):
    """ Writes log entry for a message
    """
    with conn.channel() as chan:
        print "processor|%s::logging message: %s" % (UID, msg_body)
        chan.basic_publish(amqp.Message("processor|%s|%s|log" % (UID,msg_body)),
                           exchange = LOG_EXCHANGE,
                           routing_key = LOG_ROUTING_KEY)

if __name__ == "__main__":
    # Connect to RabbitMQ server instance
    conn = amqp.Connection(host = BROKER_HOST, 
                       userid = BROKER_USER,
                       password = BROKER_PASSWORD)
    
    consume()
