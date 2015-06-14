using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Net.Sockets;
using System.Threading;

namespace Azetquizoid
{
	class Program
	{
		static void Main(string[] args)
		{
			int port;
			if (!int.TryParse(Environment.GetEnvironmentVariable("port"), out port) && !int.TryParse(Environment.GetEnvironmentVariable("PORT"), out port)) port = 3000;
			var server = new SimpleHTTPServer("Content", 3000, new Tuple<string, Type>("/echo", typeof(EchoClient)));
			Console.ReadLine();
		}
	}
}