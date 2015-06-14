using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Azetquizoid
{
    public abstract class WSClient
    {
        public WebSocket Socket;

        public abstract void Opened();
        public abstract void Closed();
        public abstract void Received(string message);

        public async Task SendAsync(string message)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            var segment = new ArraySegment<byte>(bytes);
            await Socket.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
        }

        public void Send(string message)
        {
            SendAsync(message).Wait();
        }

        public void Close()
        {

        }
    }

    public class EchoClient : WSClient
    {
        public override void Opened()
        {
        }

        public override void Closed()
        {
        }

        public override void Received(string message)
        {
            Send(message);
        }
    }
}
