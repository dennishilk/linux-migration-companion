using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal sealed class MainForm : Form
    {
        private static readonly Color Ink = Color.FromArgb(20, 36, 31);
        private static readonly Color Muted = Color.FromArgb(79, 98, 91);
        private static readonly Color Teal = Color.FromArgb(7, 95, 81);
        private static readonly Color PaleTeal = Color.FromArgb(230, 247, 241);
        private static readonly Color Border = Color.FromArgb(190, 205, 199);

        private readonly Strings text;
        private readonly Button createButton;
        private readonly Label statusLabel;
        private readonly Label fileLabel;
        private readonly FlowLayoutPanel resultActions;
        private readonly Button openFolderButton;
        private string createdPath;

        public MainForm()
        {
            text = Strings.ForCurrentUser();
            Text = text.WindowTitle;
            AccessibleName = text.WindowTitle;
            AccessibleDescription = text.Boundary;
            StartPosition = FormStartPosition.CenterScreen;
            AutoScaleMode = AutoScaleMode.Dpi;
            AutoScroll = true;
            BackColor = Color.FromArgb(248, 250, 249);
            ForeColor = Ink;
            Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point);
            ClientSize = new Size(700, 680);
            MinimumSize = new Size(560, 580);

            TableLayoutPanel layout = new TableLayoutPanel
            {
                AutoSize = true,
                AutoSizeMode = AutoSizeMode.GrowAndShrink,
                ColumnCount = 1,
                Dock = DockStyle.Top,
                Padding = new Padding(34, 28, 34, 28)
            };
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            Controls.Add(layout);

            Label product = Label(text.Product, 11F, FontStyle.Bold, Teal);
            product.Margin = new Padding(0, 0, 0, 7);
            layout.Controls.Add(product);

            Label heading = Label(text.Heading, 24F, FontStyle.Bold, Ink);
            heading.Margin = new Padding(0, 0, 0, 18);
            layout.Controls.Add(heading);

            Label boundary = Label(text.Boundary, 11F, FontStyle.Regular, Ink);
            boundary.Margin = new Padding(0, 0, 0, 12);
            boundary.AccessibleName = text.Boundary;
            layout.Controls.Add(boundary);

            Label properties = Label(text.Properties, 9F, FontStyle.Bold, Teal);
            properties.Margin = new Padding(0, 0, 0, 22);
            layout.Controls.Add(properties);

            Panel privacyPanel = new Panel
            {
                AutoSize = true,
                AutoSizeMode = AutoSizeMode.GrowAndShrink,
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                Dock = DockStyle.Top,
                Padding = new Padding(16),
                Margin = new Padding(0, 0, 0, 18)
            };
            TableLayoutPanel privacyLayout = new TableLayoutPanel { AutoSize = true, ColumnCount = 1, Dock = DockStyle.Top };
            privacyLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            Label privacyHeading = Label(text.NotCollectedHeading, 10F, FontStyle.Bold, Ink);
            privacyHeading.Margin = new Padding(0, 0, 0, 7);
            Label privacyCopy = Label(text.NotCollected, 9F, FontStyle.Regular, Muted);
            privacyLayout.Controls.Add(privacyHeading);
            privacyLayout.Controls.Add(privacyCopy);
            privacyPanel.Controls.Add(privacyLayout);
            layout.Controls.Add(privacyPanel);

            Label destination = Label(text.Destination, 9F, FontStyle.Regular, Muted);
            destination.Margin = new Padding(0, 0, 0, 14);
            layout.Controls.Add(destination);

            createButton = new Button
            {
                AutoSize = true,
                MinimumSize = new Size(235, 46),
                Text = text.Create,
                BackColor = Teal,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                UseVisualStyleBackColor = false,
                AccessibleName = text.Create.Replace("&", string.Empty),
                AccessibleDescription = text.Destination,
                Margin = new Padding(0, 0, 0, 18),
                TabIndex = 0
            };
            createButton.FlatAppearance.BorderColor = Teal;
            createButton.Click += CreateSnapshot;
            layout.Controls.Add(createButton);
            AcceptButton = createButton;

            statusLabel = Label(string.Empty, 11F, FontStyle.Bold, Teal);
            statusLabel.Margin = new Padding(0, 0, 0, 6);
            statusLabel.Visible = false;
            layout.Controls.Add(statusLabel);

            fileLabel = Label(string.Empty, 9F, FontStyle.Regular, Muted);
            fileLabel.Margin = new Padding(0, 0, 0, 10);
            fileLabel.Visible = false;
            layout.Controls.Add(fileLabel);

            resultActions = new FlowLayoutPanel
            {
                AutoSize = true,
                FlowDirection = FlowDirection.LeftToRight,
                Margin = new Padding(0, 0, 0, 24),
                Visible = false,
                WrapContents = true
            };
            openFolderButton = SecondaryButton(text.OpenFolder);
            openFolderButton.AccessibleName = text.OpenFolder.Replace("&", string.Empty);
            openFolderButton.Click += OpenCreatedFolder;
            Button closeButton = SecondaryButton(text.Close);
            closeButton.AccessibleName = text.Close.Replace("&", string.Empty);
            closeButton.Click += delegate { Close(); };
            resultActions.Controls.Add(openFolderButton);
            resultActions.Controls.Add(closeButton);
            layout.Controls.Add(resultActions);

            Label footer = Label(text.Footer, 8F, FontStyle.Regular, Muted);
            footer.Margin = new Padding(0, 12, 0, 0);
            layout.Controls.Add(footer);
        }

        private async void CreateSnapshot(object sender, EventArgs eventArgs)
        {
            createButton.Enabled = false;
            createButton.Text = text.Creating;
            UseWaitCursor = true;
            statusLabel.Visible = false;
            fileLabel.Visible = false;
            resultActions.Visible = false;

            try
            {
                createdPath = await Task.Run(() =>
                {
                    HardwareSnapshot snapshot = new HardwareCollector(new WindowsHardwareDataSource()).Collect();
                    return new SnapshotFileWriter().WriteToDownloads(snapshot);
                });
                statusLabel.Text = text.Success;
                statusLabel.ForeColor = Teal;
                statusLabel.BackColor = PaleTeal;
                statusLabel.Padding = new Padding(10);
                statusLabel.Visible = true;
                statusLabel.AccessibleName = text.Success;
                fileLabel.Text = Path.GetFileName(createdPath) + Environment.NewLine + Path.GetDirectoryName(createdPath);
                fileLabel.AccessibleName = text.Success + ". " + Path.GetFileName(createdPath);
                fileLabel.Visible = true;
                resultActions.Visible = true;
                openFolderButton.Focus();
            }
            catch (Exception)
            {
                ShowFailure();
            }
            finally
            {
                UseWaitCursor = false;
                createButton.Enabled = true;
                createButton.Text = text.Create;
            }
        }

        private void ShowFailure()
        {
            statusLabel.Text = text.ErrorHeading;
            statusLabel.ForeColor = Color.FromArgb(132, 37, 50);
            statusLabel.BackColor = Color.FromArgb(253, 236, 239);
            statusLabel.Padding = new Padding(10);
            statusLabel.Visible = true;
            statusLabel.AccessibleName = text.ErrorHeading;
            fileLabel.Text = text.ErrorBody;
            fileLabel.Visible = true;
            createButton.Focus();
        }

        private void OpenCreatedFolder(object sender, EventArgs eventArgs)
        {
            string directory = string.IsNullOrWhiteSpace(createdPath) ? null : Path.GetDirectoryName(createdPath);
            if (!NativeMethods.OpenFolder(directory))
            {
                MessageBox.Show(this, text.FolderError, text.WindowTitle, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private Label Label(string value, float size, FontStyle style, Color color)
        {
            return new Label
            {
                AutoSize = true,
                MaximumSize = new Size(620, 0),
                Text = value,
                Font = new Font("Segoe UI", size, style, GraphicsUnit.Point),
                ForeColor = color,
                UseMnemonic = false
            };
        }

        private Button SecondaryButton(string value)
        {
            Button button = new Button
            {
                AutoSize = true,
                MinimumSize = new Size(118, 40),
                Text = value,
                BackColor = Color.White,
                ForeColor = Ink,
                FlatStyle = FlatStyle.Flat,
                UseVisualStyleBackColor = false,
                Margin = new Padding(0, 0, 10, 0)
            };
            button.FlatAppearance.BorderColor = Border;
            return button;
        }
    }
}
