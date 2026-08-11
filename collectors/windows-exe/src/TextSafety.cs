using System;
using System.Text;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal static class TextSafety
    {
        public static string Limit(object value, int maximum)
        {
            if (value == null || maximum < 1) return null;
            string input = Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture);
            if (string.IsNullOrEmpty(input)) return null;

            StringBuilder cleaned = new StringBuilder(Math.Min(input.Length, maximum + 1));
            for (int index = 0; index < input.Length; index++)
            {
                char character = input[index];
                if (character <= '\u001f' || character == '\u007f')
                {
                    cleaned.Append(' ');
                    continue;
                }
                if (char.IsHighSurrogate(character))
                {
                    if (index + 1 < input.Length && char.IsLowSurrogate(input[index + 1]))
                    {
                        cleaned.Append(character);
                        cleaned.Append(input[index + 1]);
                        index++;
                    }
                    else
                    {
                        cleaned.Append('\ufffd');
                    }
                    continue;
                }
                if (char.IsLowSurrogate(character))
                {
                    cleaned.Append('\ufffd');
                    continue;
                }
                cleaned.Append(character);
            }

            string result = cleaned.ToString().Trim();
            if (result.Length == 0) return null;
            if (result.Length <= maximum) return result;

            int length = maximum;
            if (length > 0 && char.IsHighSurrogate(result[length - 1])) length--;
            result = result.Substring(0, length).TrimEnd();
            return result.Length == 0 ? null : result;
        }

        public static string NormalizeArchitecture(object value)
        {
            string architecture = Limit(value, 32);
            if (architecture == null) return "unknown";
            architecture = architecture.ToLowerInvariant();
            if (architecture.Contains("arm64")) return "arm64";
            if (architecture.Contains("arm")) return "arm";
            if (architecture.Contains("64")) return "x86_64";
            if (architecture.Contains("32") || architecture.Contains("86")) return "x86";
            return "unknown";
        }
    }
}
