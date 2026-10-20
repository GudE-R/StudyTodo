import WidgetKit
import SwiftUI

// アプリ側 src/widget/useTodayWidgetSync.ts が書き込む JSON を読む
private let appGroup = "group.com.studytodo.app"
private let storageKey = "todayWidget"

struct WidgetItem: Decodable {
    let title: String
    let time: String
    let color: String
}

struct WidgetDay: Decodable {
    let items: [WidgetItem]
    let total: Int
}

struct WidgetLabels: Decodable {
    let title: String
    let empty: String
    let more: String
    let openApp: String
}

struct WidgetPayload: Decodable {
    let days: [String: WidgetDay]
    let labels: WidgetLabels
}

struct TodayEntry: TimelineEntry {
    let date: Date
    let day: WidgetDay?
    let labels: WidgetLabels?
}

private func loadPayload() -> WidgetPayload? {
    guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: storageKey),
          let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(WidgetPayload.self, from: data)
}

private func dayKey(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = .current
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date)
}

private func makeEntry(for date: Date, payload: WidgetPayload?) -> TodayEntry {
    TodayEntry(date: date, day: payload?.days[dayKey(date)], labels: payload?.labels)
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> TodayEntry {
        TodayEntry(
            date: Date(),
            day: WidgetDay(items: [WidgetItem(title: "Todo", time: "09:00", color: "")], total: 1),
            labels: nil
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayEntry) -> Void) {
        completion(makeEntry(for: Date(), payload: loadPayload()))
    }

    // 今と翌日0時の2エントリ。payload には今日・明日分が入っているので、アプリを開かなくても日付で切り替わる
    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayEntry>) -> Void) {
        let payload = loadPayload()
        let now = Date()
        let calendar = Calendar.current
        let midnight = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        let nextMidnight = calendar.date(byAdding: .day, value: 1, to: midnight)!
        let entries = [makeEntry(for: now, payload: payload), makeEntry(for: midnight, payload: payload)]
        completion(Timeline(entries: entries, policy: .after(nextMidnight)))
    }
}

extension Color {
    init?(hex: String) {
        var value = hex.trimmingCharacters(in: .whitespaces)
        if value.hasPrefix("#") { value.removeFirst() }
        guard value.count == 6, let rgb = UInt64(value, radix: 16) else { return nil }
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}

struct TodayWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: TodayEntry

    private var maxItems: Int {
        switch family {
        case .systemSmall: return 3
        case .systemMedium: return 4
        default: return 8
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(entry.labels?.title ?? "Today's Todos")
                    .font(.caption)
                    .bold()
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer(minLength: 4)
                if let day = entry.day {
                    Text("\(day.total)")
                        .font(.caption)
                        .bold()
                }
            }

            if let day = entry.day {
                if day.items.isEmpty {
                    message(entry.labels?.empty ?? "All done")
                } else {
                    ForEach(Array(day.items.prefix(maxItems).enumerated()), id: \.offset) { _, item in
                        row(item)
                    }
                    Spacer(minLength: 0)
                    let rest = day.total - min(day.items.count, maxItems)
                    if rest > 0 {
                        Text((entry.labels?.more ?? "+%d more").replacingOccurrences(of: "%d", with: "\(rest)"))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                message(entry.labels?.openApp ?? "Open the app to update")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(.fill.tertiary, for: .widget)
        .widgetURL(URL(string: "studytodo://"))
    }

    private func row(_ item: WidgetItem) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(Color(hex: item.color) ?? Color.accentColor)
                .frame(width: 6, height: 6)
            Text(item.title)
                .font(.footnote)
                .lineLimit(1)
            Spacer(minLength: 4)
            if !item.time.isEmpty {
                Text(item.time)
                    .font(.caption2)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func message(_ text: String) -> some View {
        VStack {
            Spacer()
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
            Spacer()
        }
    }
}

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TodayWidgetView(entry: entry)
        }
        .configurationDisplayName("StudyTodo")
        .description("Today's Todos")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
