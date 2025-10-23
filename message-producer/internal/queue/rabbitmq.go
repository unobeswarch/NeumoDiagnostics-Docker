package queue

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/rabbitmq/amqp091-go"
)

type RabbitMQClient struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
	queue   amqp091.Queue
}

func NewRabbitMQClient(amqpURL, queueName string) (*RabbitMQClient, error) {
	conn, err := amqp091.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("Fallo al conectarse a RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("Error al abrir el canal: %w", err)
	}

	queue, err := channel.QueueDeclare(
		"diagnostic_notifications",
		true,
		false,
		false,
		false,
		amqp091.Table{
			"x-dead-letter-exchange":    "",
			"x-dead-letter-routing-key": "diagnostic_notifications_dlq",
		},
	)

	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("fallo al declarar la queue: %w", err)
	}

	return &RabbitMQClient{
		conn:    conn,
		channel: channel,
		queue:   queue,
	}, nil
}

func (r *RabbitMQClient) PublishNotification(msg NotificationMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("fallo del mensaje emarshal:%w", err)
	}

	err = r.channel.Publish(
		"",
		r.queue.Name,
		false,
		false,
		amqp091.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp091.Persistent,
		},
	)

	if err != nil {
		return fmt.Errorf("fallo al publicar el mensaje %w", err)
	}

	log.Printf("Notificacion enviada")
	return nil
}

func (r *RabbitMQClient) Close() {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
}
